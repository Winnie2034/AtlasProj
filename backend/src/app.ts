import express from "express";
import { authRouter } from "./routes/auth.routes.js";
import { dashboardRouter } from "./routes/dashboard.routes.js";
import { routinesRouter } from "./routes/routines.routes.js";
import { syncRouter } from "./routes/sync.routes.js";
import { workoutsRouter } from "./routes/workouts.routes.js";
import { hevyConnectionRouter } from "./routes/hevyConnection.routes.js";
import { requireAuth } from "./middlewares/auth.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFound } from "./middlewares/notFound.js";
import { requestLogger } from "./middlewares/requestLogger.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(requestLogger);

  app.get("/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok", version: "0.1.0" } });
  });

  app.use("/api/auth", authRouter);
  app.use("/api", requireAuth);
  app.use("/api/hevy-connection", hevyConnectionRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/workouts", workoutsRouter);
  app.use("/api/routines", routinesRouter);
  app.use("/api/sync", syncRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
