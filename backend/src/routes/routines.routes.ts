import { Router } from "express";
import { RoutinesService } from "../services/routines.service.js";

export const routinesRouter = Router();
const service = new RoutinesService();

routinesRouter.get("/", async (_req, res, next) => {
  try {
    res.json({ success: true, data: await service.list() });
  } catch (error) {
    next(error);
  }
});
