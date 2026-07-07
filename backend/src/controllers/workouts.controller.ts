import type { RequestHandler } from "express";
import { WorkoutsService } from "../services/workouts.service.js";

const service = new WorkoutsService();

export const listWorkouts: RequestHandler = async (req, res, next) => {
  try {
    const result = await service.list(req.query);
    res.json({ success: true, data: result.data, meta: result.meta });
  } catch (error) {
    next(error);
  }
};

export const getWorkout: RequestHandler = async (req, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    res.json({ success: true, data: await service.getById(id) });
  } catch (error) {
    next(error);
  }
};
