DROP INDEX "sessions_expires_at_idx";
ALTER TABLE "hevy_connections" DROP COLUMN "hevy_user_id", DROP COLUMN "last_synced_at", DROP COLUMN "last_error_code";
