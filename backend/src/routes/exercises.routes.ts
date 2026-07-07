import { Router } from "express";
import { listExercises } from "../controllers/exercises.controller.js";

export const exercisesRouter = Router();

exercisesRouter.get("/", listExercises);
