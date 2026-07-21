import { Router, type Response } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { readSessionToken, requireAuth, sessionCookieName } from "../middlewares/auth.js";
import { AuthService } from "../services/auth.service.js";

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(10).max(200),
});
const registrationSchema = credentialsSchema.extend({ displayName: z.string().trim().max(80).optional() });
const service = new AuthService();

export const authRouter = Router();

const setSessionCookie = (res: Response, token: string, expiresAt: Date) => {
  res.cookie(sessionCookieName, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    expires: expiresAt,
    path: "/",
  });
};

authRouter.post("/register", async (req, res, next) => {
  try {
    const input = registrationSchema.parse(req.body);
    const result = await service.register(input.email, input.password, input.displayName);
    setSessionCookie(res, result.token, result.expiresAt);
    res.status(201).json({ success: true, data: result.user });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const input = credentialsSchema.parse(req.body);
    const result = await service.login(input.email, input.password);
    setSessionCookie(res, result.token, result.expiresAt);
    res.json({ success: true, data: result.user });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", async (req, res, next) => {
  try {
    await service.logout(readSessionToken(req.headers.cookie));
    res.clearCookie(sessionCookieName, { path: "/" });
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, (_req, res) => {
  res.json({ success: true, data: res.locals.user });
});
