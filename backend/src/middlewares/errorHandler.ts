import type { ErrorRequestHandler } from "express";
import { AppError } from "../utils/AppError.js";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: err.issues[0]?.message ?? "Invalid request" },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    res.status(409).json({
      success: false,
      error: { code: "CONFLICT", message: "That account information is already in use" },
    });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.httpStatus).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
    return;
  }

  console.error({ err }, "Unhandled request error");
  res.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "An unexpected internal error occurred" },
  });
};
