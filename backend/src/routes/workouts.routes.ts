import { Router } from "express";
import { WorkoutsService } from "../services/workouts.service.js";

export const workoutsRouter = Router();
const service = new WorkoutsService();

workoutsRouter.get("/", async (req, res, next) => {
  try {
    const result = await service.list(req.query);
    res.json({ success: true, data: result.data, meta: result.meta });
  } catch (error) {
    next(error);
  }
});

workoutsRouter.get("/:id", async (req, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    res.json({ success: true, data: await service.getById(id) });
  } catch (error) {
    next(error);
  }
});
