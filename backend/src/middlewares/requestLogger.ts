import type { RequestHandler } from "express";

export const requestLogger: RequestHandler = (req, res, next) => {
  const started = Date.now();
  res.on("finish", () => {
    console.info(
      { method: req.method, path: req.path, status: res.statusCode, durationMs: Date.now() - started },
      "request complete",
    );
  });
  next();
};
