import { prisma } from "../db/prisma.js";
import { ConflictError, UnauthorizedError } from "../utils/AppError.js";
import { hashPassword, hashSessionToken, newSessionToken, verifyPassword } from "../utils/security.js";

const legacyUserId = "00000000-0000-0000-0000-000000000001";
const sessionLifetimeMs = 30 * 24 * 60 * 60 * 1000;

export class AuthService {
  async register(email: string, password: string, displayName?: string) {
    const normalizedEmail = email.trim().toLowerCase();
    if (await prisma.user.findUnique({ where: { email: normalizedEmail } })) {
      throw new ConflictError("An account with that email already exists", "EMAIL_TAKEN");
    }

    const passwordHash = await hashPassword(password);
    const claimed = await prisma.user.updateMany({
      where: { id: legacyUserId, passwordHash: null },
      data: { email: normalizedEmail, passwordHash, displayName: displayName?.trim() || "Atlas User" },
    });
    const user = claimed.count
      ? await prisma.user.findUniqueOrThrow({ where: { id: legacyUserId } })
      : await prisma.user.create({
          data: { email: normalizedEmail, passwordHash, displayName: displayName?.trim() || null },
        });

    return this.createSession(user);
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
      throw new UnauthorizedError("Email or password is incorrect", "INVALID_CREDENTIALS");
    }
    return this.createSession(user);
  }

  async logout(token: string | undefined) {
    if (token) {
      await prisma.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
    }
  }

  private async createSession(user: { id: string; email: string | null; displayName: string | null }) {
    const token = newSessionToken();
    const expiresAt = new Date(Date.now() + sessionLifetimeMs);
    await prisma.session.create({ data: { userId: user.id, tokenHash: hashSessionToken(token), expiresAt } });
    return { user: { id: user.id, email: user.email, displayName: user.displayName }, token, expiresAt };
  }
}
