import type { RequestHandler } from "express";
import { ExercisesService } from "../services/exercises.service.js";

const service = new ExercisesService();

export const listExercises: RequestHandler = async (req, res, next) => {
  try {
    res.json({ success: true, data: await service.list(req.query) });
  } catch (error) {
    next(error);
  }
};
