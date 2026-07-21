import { prisma } from "../db/prisma.js";
import { hevyKeyEncryptionKey } from "../config/env.js";
import { ConflictError } from "../utils/AppError.js";
import { decryptValue, encryptValue } from "../utils/security.js";
import { HevyClient } from "./hevy/hevy.client.js";

export class HevyConnectionService {
  async getStatus(userId: string) {
    return { connected: Boolean(await prisma.hevyConnection.findUnique({ where: { userId }, select: { id: true } })) };
  }

  async connect(userId: string, apiKey: string) {
    const hevy = new HevyClient(apiKey);
    await hevy.getUserInfo();
    const encrypted = encryptValue(apiKey, hevyKeyEncryptionKey);
    await prisma.hevyConnection.upsert({
      where: { userId },
      create: {
        userId,
        apiKeyCiphertext: encrypted.ciphertext,
        apiKeyIv: encrypted.iv,
        apiKeyTag: encrypted.tag,
      },
      update: {
        apiKeyCiphertext: encrypted.ciphertext,
        apiKeyIv: encrypted.iv,
        apiKeyTag: encrypted.tag,
        status: "connected",
      },
    });
    return { connected: true };
  }

  async disconnect(userId: string) {
    await prisma.hevyConnection.deleteMany({ where: { userId } });
  }

  async clientForUser(userId: string) {
    const connection = await prisma.hevyConnection.findUnique({ where: { userId } });
    if (!connection) throw new ConflictError("Connect your Hevy account before using this feature", "HEVY_NOT_CONNECTED");
    const apiKey = decryptValue(
      { ciphertext: connection.apiKeyCiphertext, iv: connection.apiKeyIv, tag: connection.apiKeyTag },
      hevyKeyEncryptionKey,
    );
    return { client: new HevyClient(apiKey), connection };
  }

  async beginSync(userId: string) {
    const staleSync = new Date(Date.now() - 15 * 60_000);
    const result = await prisma.hevyConnection.updateMany({
      where: { userId, OR: [{ status: { not: "syncing" } }, { updatedAt: { lt: staleSync } }] },
      data: { status: "syncing" },
    });
    if (result.count === 0) {
      const exists = await prisma.hevyConnection.findUnique({ where: { userId }, select: { id: true } });
      throw new ConflictError(
        exists ? "A sync is already running" : "Connect your Hevy account before syncing",
        exists ? "SYNC_ALREADY_RUNNING" : "HEVY_NOT_CONNECTED",
      );
    }
  }

  finishSync(userId: string, cursor: string, succeeded: boolean) {
    return prisma.hevyConnection.update({
      where: { userId },
      data: {
        status: succeeded ? "connected" : "error",
        lastSuccessfulSyncCursor: succeeded ? cursor : undefined,
      },
    });
  }
}
