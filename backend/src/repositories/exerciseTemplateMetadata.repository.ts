import type { PrismaClient } from "@prisma/client";
import { prisma } from "../db/prisma.js";

export type ExerciseTemplateMetadataInput = {
  hevyExerciseTemplateId: string;
  title: string;
  type?: string | null;
  primaryMuscleGroup?: string | null;
  secondaryMuscleGroups: string[];
  equipment?: string | null;
  isCustom: boolean;
};

export class ExerciseTemplateMetadataRepository {
  constructor(private db: PrismaClient = prisma) {}

  findByTemplateIds(templateIds: string[]) {
    return this.db.exerciseTemplateMetadata.findMany({
      where: { hevyExerciseTemplateId: { in: templateIds } },
    });
  }

  async missingTemplateIds(templateIds: string[]) {
    const uniqueIds = Array.from(new Set(templateIds.filter((id) => id && id !== "unknown")));
    if (uniqueIds.length === 0) return [];

    const existing = await this.findByTemplateIds(uniqueIds);
    const existingIds = new Set(existing.map((row) => row.hevyExerciseTemplateId));
    return uniqueIds.filter((id) => !existingIds.has(id));
  }

  upsert(metadata: ExerciseTemplateMetadataInput) {
    const fetchedAt = new Date();
    return this.db.exerciseTemplateMetadata.upsert({
      where: { hevyExerciseTemplateId: metadata.hevyExerciseTemplateId },
      create: {
        ...metadata,
        fetchedAt,
      },
      update: {
        title: metadata.title,
        type: metadata.type,
        primaryMuscleGroup: metadata.primaryMuscleGroup,
        secondaryMuscleGroups: metadata.secondaryMuscleGroups,
        equipment: metadata.equipment,
        isCustom: metadata.isCustom,
        fetchedAt,
      },
    });
  }
}
