-- Existing single-user data is attached to a claimable legacy account.
ALTER TABLE "users" ADD COLUMN "password_hash" TEXT;

INSERT INTO "users" ("id", "email", "display_name", "created_at", "updated_at")
SELECT '00000000-0000-0000-0000-000000000001', NULL, 'Atlas User', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM "workouts")
   OR EXISTS (SELECT 1 FROM "exercise_template_metadata")
   OR EXISTS (SELECT 1 FROM "sync_history")
ON CONFLICT ("id") DO NOTHING;

ALTER TABLE "workouts" ADD COLUMN "user_id" TEXT;
ALTER TABLE "exercise_template_metadata" ADD COLUMN "user_id" TEXT;
ALTER TABLE "sync_history" ADD COLUMN "user_id" TEXT;

UPDATE "workouts" SET "user_id" = '00000000-0000-0000-0000-000000000001' WHERE "user_id" IS NULL;
UPDATE "exercise_template_metadata" SET "user_id" = '00000000-0000-0000-0000-000000000001' WHERE "user_id" IS NULL;
UPDATE "sync_history" SET "user_id" = '00000000-0000-0000-0000-000000000001' WHERE "user_id" IS NULL;

ALTER TABLE "workouts" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "exercise_template_metadata" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "sync_history" ALTER COLUMN "user_id" SET NOT NULL;

DROP INDEX "workouts_hevy_id_key";
DROP INDEX "workouts_start_time_idx";
DROP INDEX "workouts_title_idx";
DROP INDEX "exercise_template_metadata_hevy_exercise_template_id_key";
DROP INDEX "exercise_template_metadata_primary_muscle_group_idx";
DROP INDEX "sync_history_started_at_idx";

CREATE UNIQUE INDEX "workouts_user_id_hevy_id_key" ON "workouts"("user_id", "hevy_id");
CREATE INDEX "workouts_user_id_start_time_idx" ON "workouts"("user_id", "start_time");
CREATE INDEX "workouts_user_id_title_idx" ON "workouts"("user_id", "title");
CREATE UNIQUE INDEX "metadata_user_template_key" ON "exercise_template_metadata"("user_id", "hevy_exercise_template_id");
CREATE INDEX "metadata_user_primary_muscle_idx" ON "exercise_template_metadata"("user_id", "primary_muscle_group");
CREATE INDEX "sync_history_user_id_started_at_idx" ON "sync_history"("user_id", "started_at");

CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

CREATE TABLE "hevy_connections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "hevy_user_id" TEXT,
    "api_key_ciphertext" TEXT NOT NULL,
    "api_key_iv" TEXT NOT NULL,
    "api_key_tag" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'connected',
    "last_successful_sync_cursor" TEXT,
    "last_synced_at" TIMESTAMP(3),
    "last_error_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "hevy_connections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "hevy_connections_user_id_key" ON "hevy_connections"("user_id");

ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hevy_connections" ADD CONSTRAINT "hevy_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exercise_template_metadata" ADD CONSTRAINT "exercise_template_metadata_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sync_history" ADD CONSTRAINT "sync_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP TABLE "application_settings";
