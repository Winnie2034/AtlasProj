import { Router } from "express";
import { DashboardService } from "../services/dashboard.service.js";
import { ValidationError } from "../utils/AppError.js";

export const dashboardRouter = Router();
const service = new DashboardService();

const parseDashboardDate = (value: unknown) => {
  if (value == null || value === "") return undefined;
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (typeof rawValue !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    throw new ValidationError("Dashboard date must use YYYY-MM-DD format");
  }

  const [year, month, day] = rawValue.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new ValidationError("Dashboard date is not a valid calendar date");
  }
  return date;
};

dashboardRouter.get("/selected-workout", async (req, res, next) => {
  try {
    res.json({ success: true, data: await service.getSelectedWorkout(res.locals.userId, parseDashboardDate(req.query.date) ?? new Date()) });
  } catch (error) {
    next(error);
  }
});

dashboardRouter.get("/", async (_req, res, next) => {
  try {
    res.json({ success: true, data: await service.getDashboard(res.locals.userId) });
  } catch (error) {
    next(error);
  }
});
