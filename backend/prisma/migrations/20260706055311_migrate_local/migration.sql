-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "display_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workouts" (
    "id" TEXT NOT NULL,
    "hevy_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "hevy_created_at" TIMESTAMP(3) NOT NULL,
    "hevy_updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "workout_id" TEXT NOT NULL,
    "hevy_exercise_template_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "exercise_index" INTEGER NOT NULL,
    "superset_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sets" (
    "id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "set_index" INTEGER NOT NULL,
    "set_type" TEXT NOT NULL,
    "weight_kg" DECIMAL(6,2),
    "reps" INTEGER,
    "distance_meters" DECIMAL(8,2),
    "duration_seconds" INTEGER,
    "rpe" DECIMAL(3,1),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_history" (
    "id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "finished_at" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "workouts_fetched" INTEGER NOT NULL DEFAULT 0,
    "workouts_created" INTEGER NOT NULL DEFAULT 0,
    "workouts_updated" INTEGER NOT NULL DEFAULT 0,
    "workouts_deleted" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "workouts_hevy_id_key" ON "workouts"("hevy_id");

-- CreateIndex
CREATE INDEX "workouts_start_time_idx" ON "workouts"("start_time");

-- CreateIndex
CREATE INDEX "workouts_title_idx" ON "workouts"("title");

-- CreateIndex
CREATE INDEX "exercises_workout_id_idx" ON "exercises"("workout_id");

-- CreateIndex
CREATE INDEX "exercises_hevy_exercise_template_id_idx" ON "exercises"("hevy_exercise_template_id");

-- CreateIndex
CREATE INDEX "sets_exercise_id_idx" ON "sets"("exercise_id");

-- CreateIndex
CREATE INDEX "sync_history_started_at_idx" ON "sync_history"("started_at");

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "workouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sets" ADD CONSTRAINT "sets_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
