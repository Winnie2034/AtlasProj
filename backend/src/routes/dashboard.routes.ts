import { Router } from "express";
import { getDashboard, getSelectedWorkout } from "../controllers/dashboard.controller.js";

export const dashboardRouter = Router();

dashboardRouter.get("/selected-workout", getSelectedWorkout);
dashboardRouter.get("/", getDashboard);
