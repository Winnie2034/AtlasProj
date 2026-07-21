import { z } from "zod";

process.loadEnvFile();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  HEVY_KEY_ENCRYPTION_KEY: z.string().refine((value) => Buffer.from(value, "base64").length === 32, {
    message: "HEVY_KEY_ENCRYPTION_KEY must be a base64-encoded 32-byte key",
  }),
  HEVY_API_BASE_URL: z.string().url().default("https://api.hevyapp.com"),
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export const env = envSchema.parse(process.env);

export const hevyKeyEncryptionKey = Buffer.from(env.HEVY_KEY_ENCRYPTION_KEY, "base64");
