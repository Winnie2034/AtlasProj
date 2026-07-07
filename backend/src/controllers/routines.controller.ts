import type { RequestHandler } from "express";
import { RoutinesService } from "../services/routines.service.js";

const service = new RoutinesService();

export const listRoutines: RequestHandler = async (_req, res, next) => {
  try {
    res.json({ success: true, data: await service.list() });
  } catch (error) {
    next(error);
  }
};
