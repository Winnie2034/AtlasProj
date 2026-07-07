import { Router } from "express";
import { listRoutines } from "../controllers/routines.controller.js";

export const routinesRouter = Router();

routinesRouter.get("/", listRoutines);
