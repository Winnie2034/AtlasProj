import type { RequestHandler } from "express";
import { prisma } from "../db/prisma.js";
import { UnauthorizedError } from "../utils/AppError.js";
import { hashSessionToken } from "../utils/security.js";

export const sessionCookieName = "atlas_session";

export const readSessionToken = (cookieHeader: string | undefined) =>
  cookieHeader
    ?.split(";")
    .map((cookie) => cookie.trim().split("="))
    .find(([name]) => name === sessionCookieName)
    ?.slice(1)
    .join("=");

export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const token = readSessionToken(req.headers.cookie);
    if (!token) throw new UnauthorizedError();

    const session = await prisma.session.findUnique({
      where: { tokenHash: hashSessionToken(token) },
      include: { user: true },
    });
    if (!session || session.expiresAt <= new Date()) {
      if (session) await prisma.session.delete({ where: { id: session.id } });
      throw new UnauthorizedError();
    }

    res.locals.userId = session.userId;
    res.locals.user = { id: session.user.id, email: session.user.email, displayName: session.user.displayName };
    next();
  } catch (error) {
    next(error);
  }
};
