import { Router } from "express";
import { getWorkout, listWorkouts } from "../controllers/workouts.controller.js";

export const workoutsRouter = Router();

workoutsRouter.get("/", listWorkouts);
workoutsRouter.get("/:id", getWorkout);
