import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  HEVY_API_KEY: z.string().min(1),
  HEVY_API_BASE_URL: z.string().url().default("https://api.hevyapp.com"),
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.string().default("info"),
});

export const env = envSchema.parse(process.env);
