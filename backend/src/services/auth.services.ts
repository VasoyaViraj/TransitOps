import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { db } from "../db/index.js";
import { users, sessions, rolePermissions } from "../db/schema/index.js";
import type { RegisterInput, LoginInput } from "../validators/auth.validator.js";
import type { UserRole } from "../types/index.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-min-32-characters-default";
const ACCESS_TOKEN_EXPIRES_IN = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRES_IN_DAYS = 7;

function generateAccessToken(userId: string, role: UserRole): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString("hex");
}

export function getDefaultPermissionsForRole(role: UserRole) {
  switch (role) {
    case "ADMIN":
      return { fleet: "EDIT", drivers: "EDIT", trips: "EDIT", maintenance: "EDIT", fuelExpenses: "EDIT", analytics: "EDIT" };
    case "FLEET_MANAGER":
      return { fleet: "EDIT", drivers: "NONE", trips: "NONE", maintenance: "EDIT", fuelExpenses: "NONE", analytics: "NONE" };
    case "DISPATCHER":
      return { fleet: "VIEW", drivers: "VIEW", trips: "EDIT", maintenance: "NONE", fuelExpenses: "NONE", analytics: "NONE" };
    case "SAFETY_OFFICER":
      return { fleet: "NONE", drivers: "EDIT", trips: "NONE", maintenance: "VIEW", fuelExpenses: "VIEW", analytics: "NONE" };
    case "FINANCIAL_ANALYST":
      return { fleet: "NONE", drivers: "NONE", trips: "NONE", maintenance: "NONE", fuelExpenses: "EDIT", analytics: "EDIT" };
    default:
      return { fleet: "NONE", drivers: "NONE", trips: "NONE", maintenance: "NONE", fuelExpenses: "NONE", analytics: "NONE" };
  }
}

export async function getPermissionsForRole(role: UserRole) {
  const [record] = await db
    .select()
    .from(rolePermissions)
    .where(eq(rolePermissions.role, role))
    .limit(1);

  if (record) {
    return {
      fleet: record.fleet,
      drivers: record.drivers,
      trips: record.trips,
      maintenance: (record as any).maintenance ?? "NONE",
      fuelExpenses: record.fuelExpenses,
      analytics: record.analytics,
    };
  }

  // Seed default permission in DB if not found
  const defaults = getDefaultPermissionsForRole(role);
  try {
    const [inserted] = await db
      .insert(rolePermissions)
      .values({
        role,
        ...defaults,
      })
      .returning();
    return {
      fleet: inserted.fleet,
      drivers: inserted.drivers,
      trips: inserted.trips,
      maintenance: (inserted as any).maintenance ?? "NONE",
      fuelExpenses: inserted.fuelExpenses,
      analytics: inserted.analytics,
    };
  } catch {
    // In case of race condition or missing table, return defaults
    return defaults;
  }
}

export async function createSession(userId: string, token: string) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_IN_DAYS);

  await db.insert(sessions).values({
    userId,
    refreshToken: token,
    expiresAt,
  });
}

export async function register(data: RegisterInput) {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (existing.length > 0) {
    throw Object.assign(new Error("User already exists"), { statusCode: 409 });
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);
  const userRole = (data.role || "FLEET_MANAGER") as UserRole;

  if (userRole === "ADMIN") {
    throw Object.assign(new Error("Admin users must be provisioned by an existing administrator"), { statusCode: 403 });
  }

  const [newUser] = await db
    .insert(users)
    .values({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: userRole,
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    });

  const accessToken = generateAccessToken(newUser.id, newUser.role as UserRole);
  const refreshToken = generateRefreshToken();

  await createSession(newUser.id, refreshToken);
  const permissions = await getPermissionsForRole(newUser.role as UserRole);

  return {
    user: {
      ...newUser,
      permissions,
    },
    accessToken,
    refreshToken,
  };
}

export async function login(data: LoginInput) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (!user) {
    throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
  }

  // If user selected a specific role, verify it matches
  if (data.role && user.role !== data.role) {
    throw Object.assign(new Error("Invalid role for this user"), { statusCode: 401 });
  }

  const isMatch = await bcrypt.compare(data.password, user.password);
  if (!isMatch) {
    throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
  }

  const accessToken = generateAccessToken(user.id, user.role as UserRole);
  const refreshToken = generateRefreshToken();

  await createSession(user.id, refreshToken);
  const permissions = await getPermissionsForRole(user.role as UserRole);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions,
    },
    accessToken,
    refreshToken,
  };
}

export async function refresh(token: string) {
  const [session] = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.refreshToken, token),
        eq(sessions.revoked, false)
      )
    )
    .limit(1);

  if (!session || session.expiresAt < new Date()) {
    throw Object.assign(new Error("Invalid or expired session"), { statusCode: 401 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) {
    throw Object.assign(new Error("User not found"), { statusCode: 401 });
  }

  // Revoke old session and generate new tokens (Token Rotation)
  await db
    .update(sessions)
    .set({ revoked: true })
    .where(eq(sessions.id, session.id));

  const newAccessToken = generateAccessToken(user.id, user.role as UserRole);
  const newRefreshToken = generateRefreshToken();

  await createSession(user.id, newRefreshToken);
  const permissions = await getPermissionsForRole(user.role as UserRole);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions,
    },
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logout(token: string) {
  await db
    .update(sessions)
    .set({ revoked: true })
    .where(eq(sessions.refreshToken, token));
}

export async function getProfile(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw Object.assign(new Error("User not found"), { statusCode: 404 });
  }

  const permissions = await getPermissionsForRole(user.role as UserRole);

  return {
    ...user,
    permissions,
  };
}

export async function updateRolePermissions(role: UserRole, permissionsData: {
  fleet: string;
  drivers: string;
  trips: string;
  fuelExpenses: string;
  analytics: string;
}) {
  const [existing] = await db
    .select()
    .from(rolePermissions)
    .where(eq(rolePermissions.role, role))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(rolePermissions)
      .set({
        ...permissionsData,
        updatedAt: new Date(),
      })
      .where(eq(rolePermissions.role, role))
      .returning();
    return updated;
  } else {
    const [inserted] = await db
      .insert(rolePermissions)
      .values({
        role,
        ...permissionsData,
      })
      .returning();
    return inserted;
  }
}

export async function getAllRolePermissions() {
  const roles: UserRole[] = ["FLEET_MANAGER", "DISPATCHER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"];
  const list = [];
  for (const role of roles) {
    const permissions = await getPermissionsForRole(role);
    list.push({ role, ...permissions });
  }
  return list;
}
