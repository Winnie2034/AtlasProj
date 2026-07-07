import type { RequestHandler } from "express";
import { SyncService } from "../services/sync.service.js";

const service = new SyncService();

export const triggerSync: RequestHandler = async (_req, res, next) => {
  try {
    res.status(201).json({ success: true, data: await service.runSync() });
  } catch (error) {
    next(error);
  }
};
