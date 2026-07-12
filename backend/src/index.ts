import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/error-handler.js";
import authRoutes from "./routes/auth.routes.js";
import vehicleRoutes from "./routes/vehicle.routes.js";
import driverRoutes from "./routes/driver.routes.js";
import tripRoutes from "./routes/trip.routes.js";
import maintenanceRoutes from "./routes/maintenance.routes.js";
import reportRoutes from "./routes/report.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import fuelLogsRoutes from "./routes/fuel-logs.routes.js";
import expensesRoutes from "./routes/expenses.routes.js";
import taskRoutes from "./routes/task.routes.js";

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/fuel-logs", fuelLogsRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/tasks", taskRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`TransitOps API running on http://localhost:${PORT}`);
});
