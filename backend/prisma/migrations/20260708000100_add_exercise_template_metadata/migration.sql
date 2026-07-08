-- CreateTable
CREATE TABLE "exercise_template_metadata" (
    "id" TEXT NOT NULL,
    "hevy_exercise_template_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT,
    "primary_muscle_group" TEXT,
    "secondary_muscle_groups" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "equipment" TEXT,
    "is_custom" BOOLEAN NOT NULL DEFAULT false,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercise_template_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exercise_template_metadata_hevy_exercise_template_id_key" ON "exercise_template_metadata"("hevy_exercise_template_id");

-- CreateIndex
CREATE INDEX "exercise_template_metadata_primary_muscle_group_idx" ON "exercise_template_metadata"("primary_muscle_group");
