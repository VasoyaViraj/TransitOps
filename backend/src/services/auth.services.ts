import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema/index.js";
import type { RegisterInput, LoginInput } from "../validators/auth.validator.js";
import type { UserRole } from "../types/index.js";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function parseExpiresIn(value: string): number {
  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60;
  const num = parseInt(match[1], 10);
  switch (match[2]) {
    case "s": return num;
    case "m": return num * 60;
    case "h": return num * 3600;
    case "d": return num * 86400;
    default: return 7 * 24 * 60 * 60;
  }
}

function generateToken(userId: string, role: UserRole): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: parseExpiresIn(JWT_EXPIRES_IN) });
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

  const [newUser] = await db
    .insert(users)
    .values({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role || "FLEET_MANAGER",
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    });

  const token = generateToken(newUser.id, newUser.role as UserRole);

  return { user: newUser, token };
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

  const isMatch = await bcrypt.compare(data.password, user.password);
  if (!isMatch) {
    throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
  }

  const token = generateToken(user.id, user.role as UserRole);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
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

  return user;
}
