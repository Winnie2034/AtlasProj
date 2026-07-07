import { Router } from "express";
import { triggerSync } from "../controllers/sync.controller.js";

export const syncRouter = Router();

syncRouter.post("/", triggerSync);
