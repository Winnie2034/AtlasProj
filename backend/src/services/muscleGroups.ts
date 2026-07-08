import type { ExerciseTemplateMetadata } from "@prisma/client";

export const ATLAS_MUSCLE_GROUPS = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Other"] as const;

export type AtlasMuscleGroup = (typeof ATLAS_MUSCLE_GROUPS)[number];

export const hevyMuscleToAtlasGroup = (muscle: string): AtlasMuscleGroup => {
  const normalized = muscle.toLowerCase();
  if (normalized === "chest") return "Chest";
  if (normalized === "shoulders") return "Shoulders";
  if (["biceps", "triceps", "forearms"].includes(normalized)) return "Arms";
  if (["lats", "upper_back", "lower_back", "traps", "neck"].includes(normalized)) return "Back";
  if (["quadriceps", "hamstrings", "glutes", "calves", "adductors", "abductors"].includes(normalized)) return "Legs";
  if (normalized === "abdominals") return "Core";
  return "Other";
};

export const classifyTitleFallback = (title: string): AtlasMuscleGroup => {
  const name = title.toLowerCase();
  if (/(row|pull[- ]?up|chin[- ]?up|lat|pulldown|deadlift|back extension|shrug|trap)/.test(name)) return "Back";
  if (/(bench|chest|pec|dip|fly|crossover)/.test(name)) return "Chest";
  if (/(push[- ]?up)/.test(name)) return "Chest";
  if (/(squat|leg press|leg curl|leg extension|lunge|calf|quad|hamstring|glute|hip thrust|rdl|romanian)/.test(name)) {
    return "Legs";
  }
  if (/(shoulder|overhead|military|lateral raise|front raise|rear delt|arnold|face pull)/.test(name)) return "Shoulders";
  if (/(bicep|tricep|curl|extension|skullcrusher|hammer|preacher|pushdown)/.test(name)) return "Arms";
  if (/(abs|abdominal|core|plank|crunch|sit[- ]?up|russian twist|leg raise|hanging knee)/.test(name)) return "Core";
  return "Other";
};

export const metadataMuscleGroups = (metadata: ExerciseTemplateMetadata | undefined, fallbackTitle: string) => {
  if (!metadata?.primaryMuscleGroup) {
    return [classifyTitleFallback(fallbackTitle)];
  }

  return Array.from(
    new Set([
      hevyMuscleToAtlasGroup(metadata.primaryMuscleGroup),
      ...metadata.secondaryMuscleGroups.map(hevyMuscleToAtlasGroup),
    ]),
  );
};

export const metadataMuscleWeights = (
  metadata: ExerciseTemplateMetadata | undefined,
  fallbackTitle: string,
): [AtlasMuscleGroup, number][] => {
  if (!metadata?.primaryMuscleGroup) {
    return [[classifyTitleFallback(fallbackTitle), 1]] as [AtlasMuscleGroup, number][];
  }

  const primaryGroup = hevyMuscleToAtlasGroup(metadata.primaryMuscleGroup);
  if (metadata.secondaryMuscleGroups.length === 0) {
    return [[primaryGroup, 1]] as [AtlasMuscleGroup, number][];
  }

  const secondaryWeight = 0.3 / metadata.secondaryMuscleGroups.length;
  return [
    [primaryGroup, 0.7],
    ...metadata.secondaryMuscleGroups.map((muscle): [AtlasMuscleGroup, number] => [
      hevyMuscleToAtlasGroup(muscle),
      secondaryWeight,
    ]),
  ];
};
