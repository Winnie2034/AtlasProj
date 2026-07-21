import { ExerciseTemplateMetadataRepository } from "../repositories/exerciseTemplateMetadata.repository.js";
import { HevyClient } from "./hevy/hevy.client.js";
import type { HevyExerciseTemplate } from "./hevy/hevy.types.js";

const toMetadataInput = (template: HevyExerciseTemplate) => ({
  hevyExerciseTemplateId: template.id,
  title: template.title,
  type: template.type ?? null,
  primaryMuscleGroup: template.primary_muscle_group ?? null,
  secondaryMuscleGroups: template.secondary_muscle_groups,
  equipment: template.equipment ?? null,
  isCustom: template.is_custom,
});

export class ExerciseTemplateMetadataService {
  constructor(
    private userId: string,
    private hevy: HevyClient,
    private metadata = new ExerciseTemplateMetadataRepository(),
  ) {}

  async ensureMetadataForTemplateIds(templateIds: string[]) {
    const missingIds = await this.metadata.missingTemplateIds(this.userId, templateIds);
    if (missingIds.length === 0) {
      return { fetched: 0, failed: 0 };
    }

    let fetched = 0;
    let failed = 0;
    for (const templateId of missingIds) {
      try {
        const template = (await this.hevy.getExerciseTemplateById(templateId)) as HevyExerciseTemplate;
        await this.metadata.upsert(this.userId, toMetadataInput(template));
        fetched += 1;
      } catch (error) {
        failed += 1;
        console.warn({ templateId, err: error }, "exercise template metadata lookup failed; using fallback classifier");
      }
    }

    return { fetched, failed };
  }
}
