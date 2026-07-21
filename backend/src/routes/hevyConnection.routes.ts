import { Router } from "express";
import { z } from "zod";
import { HevyConnectionService } from "../services/hevyConnection.service.js";

const service = new HevyConnectionService();
const connectionSchema = z.object({ apiKey: z.string().trim().min(10).max(500) });

export const hevyConnectionRouter = Router();

hevyConnectionRouter.get("/", async (_req, res, next) => {
  try {
    res.json({ success: true, data: await service.getStatus(res.locals.userId) });
  } catch (error) {
    next(error);
  }
});

hevyConnectionRouter.put("/", async (req, res, next) => {
  try {
    const { apiKey } = connectionSchema.parse(req.body);
    res.json({ success: true, data: await service.connect(res.locals.userId, apiKey) });
  } catch (error) {
    next(error);
  }
});

hevyConnectionRouter.delete("/", async (_req, res, next) => {
  try {
    await service.disconnect(res.locals.userId);
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
});
