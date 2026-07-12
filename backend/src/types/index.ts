export type UserRole = "ADMIN" | "FLEET_MANAGER" | "DISPATCHER" | "SAFETY_OFFICER" | "FINANCIAL_ANALYST";

export type VehicleStatus = "AVAILABLE" | "ON_TRIP" | "IN_SHOP" | "RETIRED";

export type DriverStatus = "AVAILABLE" | "ON_TRIP" | "OFF_DUTY" | "SUSPENDED";

export type TripStatus = "DRAFT" | "DISPATCHED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type MaintenanceStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";

export type TaskStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "WAITING_APPROVAL" | "BLOCKED" | "COMPLETED";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type TaskType = "TRIP" | "MAINTENANCE" | "INSPECTION" | "FUEL" | "EXPENSE" | "DRIVER" | "VEHICLE" | "INCIDENT" | "COMPLIANCE" | "DOCUMENT_RENEWAL" | "GENERAL_TASK";

export interface JwtPayload {
  userId: string;
  role: UserRole;
}

export interface DashboardStats {
  activeVehicles: number;
  availableVehicles: number;
  vehiclesInShop: number;
  retiredVehicles: number;
  totalVehicles: number;
  tripsRunning: number;
  driversOnDuty: number;
  totalDrivers: number;
  fleetUtilization: number;
}
