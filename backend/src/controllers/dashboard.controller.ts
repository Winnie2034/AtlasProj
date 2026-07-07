import type { RequestHandler } from "express";
import { DashboardService } from "../services/dashboard.service.js";

const service = new DashboardService();

export const getDashboard: RequestHandler = async (_req, res, next) => {
  try {
    res.json({ success: true, data: await service.getDashboard() });
  } catch (error) {
    next(error);
  }
};
