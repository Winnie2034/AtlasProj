import { Router } from "express";
import { SyncService } from "../services/sync.service.js";

export const syncRouter = Router();
const service = new SyncService();

syncRouter.post("/", async (_req, res, next) => {
  try {
    res.status(201).json({ success: true, data: await service.runSync() });
  } catch (error) {
    next(error);
  }
});
