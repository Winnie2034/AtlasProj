import { z } from "zod";

const normalizeSetPayload = (payload: unknown) => {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  const set = payload as Record<string, unknown>;
  return {
    ...set,
    type: set.type ?? set.set_type,
  };
};

const normalizePagePayload = (payload: unknown, resourceKeys: string[]) => {
  if (Array.isArray(payload)) {
    return { [resourceKeys[0]]: payload };
  }

  if (!payload || typeof payload !== "object") {
    return payload;
  }

  const body = payload as Record<string, unknown>;
  const resourceValue = resourceKeys.map((key) => body[key]).find((value) => Array.isArray(value));

  return {
    ...body,
    [resourceKeys[0]]: resourceValue ?? [],
  };
};

export const hevySetSchema = z.preprocess(
  normalizeSetPayload,
  z.object({
    index: z.number().int(),
    type: z.string().default("normal"),
    weight_kg: z.number().nullable().optional(),
    reps: z.number().int().nullable().optional(),
    distance_meters: z.number().nullable().optional(),
    duration_seconds: z.number().int().nullable().optional(),
    rpe: z.number().nullable().optional(),
  }),
);

export const hevyExerciseSchema = z.object({
  index: z.number().int(),
  title: z.string(),
  notes: z.string().nullable().optional(),
  exercise_template_id: z
    .string()
    .nullable()
    .optional()
    .transform((value) => value ?? "unknown"),
  superset_id: z.number().int().nullable().optional(),
  sets: z.array(hevySetSchema).default([]),
});

export const hevyWorkoutSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  start_time: z.string(),
  end_time: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  exercises: z.array(hevyExerciseSchema).default([]),
});

export const hevyWorkoutResponseSchema = z
  .union([hevyWorkoutSchema, z.object({ workout: hevyWorkoutSchema })])
  .transform((payload) => ("workout" in payload ? payload.workout : payload));

export const hevyWorkoutPageSchema = z
  .union([
    z.object({ workouts: z.array(hevyWorkoutSchema) }),
    z.array(hevyWorkoutSchema).transform((workouts) => ({ workouts })),
  ])
  .transform((payload) => ("workouts" in payload ? payload : { workouts: payload }));

export const hevyWorkoutCountSchema = z.preprocess((payload) => {
  if (typeof payload === "number") {
    return { count: payload };
  }

  if (payload && typeof payload === "object" && "workout_count" in payload) {
    return { count: (payload as { workout_count: unknown }).workout_count };
  }

  return payload;
}, z.object({ count: z.number().int() }));

export const hevyUserInfoSchema = z.preprocess((payload) => {
  if (!payload || typeof payload !== "object") return payload;
  const body = payload as Record<string, unknown>;
  return body.user ?? body.data ?? body;
}, z.record(z.unknown()));

export const hevyWorkoutEventSchema = z.preprocess((payload) => {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  const event = payload as Record<string, unknown>;
  const nestedWorkout = event.workout && typeof event.workout === "object" ? (event.workout as Record<string, unknown>) : {};
  const rawType = String(event.type ?? event.event_type ?? event.action ?? "updated").toLowerCase();

  return {
    id: event.id,
    workout_id: event.workout_id ?? event.workoutId ?? nestedWorkout.id ?? event.id,
    type: rawType.includes("delete") ? "deleted" : "updated",
    updated_at: event.updated_at ?? event.updatedAt ?? event.created_at ?? event.createdAt,
  };
}, z.object({
  id: z.string().optional(),
  workout_id: z.string().optional(),
  type: z.enum(["updated", "deleted"]),
  updated_at: z.string().optional(),
}));

export const hevyWorkoutEventsPageSchema = z.preprocess((payload) => {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  const body = payload as Record<string, unknown>;
  return {
    events: body.events ?? body.workout_events ?? body.workoutEvents ?? [],
  };
}, z.object({
  events: z.array(hevyWorkoutEventSchema),
}));

export const hevyExerciseTemplateSchema = z
  .object({
    id: z.coerce.string(),
    title: z.string(),
    type: z.string().optional(),
    primary_muscle_group: z.string().nullable().optional(),
    secondary_muscle_groups: z.array(z.string()).default([]),
    equipment: z.string().nullable().optional(),
    is_custom: z.boolean().optional().default(false),
  })
  .passthrough();

export const hevyExerciseTemplateResponseSchema = z
  .union([
    hevyExerciseTemplateSchema,
    z.object({ exercise_template: hevyExerciseTemplateSchema }),
    z.object({ data: hevyExerciseTemplateSchema }),
  ])
  .transform((payload) => {
    if ("exercise_template" in payload) return payload.exercise_template;
    if ("data" in payload) return payload.data;
    return payload;
  });

export const hevyRoutineSetSchema = z.preprocess(
  normalizeSetPayload,
  z
    .object({
      index: z.number().int().optional().default(0),
      type: z.string().optional().default("normal"),
      weight_kg: z.number().nullable().optional(),
      reps: z.number().int().nullable().optional(),
      distance_meters: z.number().nullable().optional(),
      duration_seconds: z.number().int().nullable().optional(),
      rpe: z.number().nullable().optional(),
    })
    .passthrough(),
);

export const hevyRoutineExerciseSchema = z
  .object({
    index: z.number().int().optional().default(0),
    title: z.string().optional().default("Untitled exercise"),
    notes: z.string().nullable().optional(),
    exercise_template_id: z
      .string()
      .nullable()
      .optional()
      .transform((value) => value ?? "unknown"),
    rest_seconds: z.number().int().nullable().optional(),
    superset_id: z.number().int().nullable().optional(),
    sets: z.array(hevyRoutineSetSchema).default([]),
  })
  .passthrough();

export const hevyRoutineSchema = z
  .object({
    id: z.coerce.string(),
    title: z.string().optional().default("Untitled routine"),
    folder_id: z.coerce.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
    exercises: z.array(hevyRoutineExerciseSchema).default([]),
  })
  .passthrough();

export const hevyRoutinePageSchema = z
  .preprocess(
    (payload) => normalizePagePayload(payload, ["routines", "data"]),
    z
      .object({
        page: z.number().int().optional(),
        page_count: z.number().int().optional(),
        routines: z.array(hevyRoutineSchema),
      })
      .passthrough(),
  )
  .transform((payload) => ({
    page: payload.page,
    page_count: payload.page_count,
    routines: payload.routines,
  }));

export const hevyRoutineFolderSchema = z
  .preprocess((payload) => {
    if (!payload || typeof payload !== "object") {
      return payload;
    }

    const folder = payload as Record<string, unknown>;
    return {
      ...folder,
      title: folder.title ?? folder.name,
    };
  }, z
    .object({
      id: z.coerce.string(),
      title: z.string().optional().default("Untitled folder"),
      index: z.number().int().optional().default(0),
      created_at: z.string().optional(),
      updated_at: z.string().optional(),
    })
    .passthrough());

export const hevyRoutineFolderPageSchema = z
  .preprocess(
    (payload) => normalizePagePayload(payload, ["routine_folders", "folders", "routineFolders", "data"]),
    z
      .object({
        page: z.number().int().optional(),
        page_count: z.number().int().optional(),
        routine_folders: z.array(hevyRoutineFolderSchema),
      })
      .passthrough(),
  )
  .transform((payload) => ({
    page: payload.page,
    page_count: payload.page_count,
    routine_folders: payload.routine_folders,
  }));

export type HevyWorkout = z.infer<typeof hevyWorkoutSchema>;
export type HevyExerciseTemplate = z.infer<typeof hevyExerciseTemplateSchema>;
export type HevyRoutine = z.infer<typeof hevyRoutineSchema>;
export type HevyRoutineFolder = z.infer<typeof hevyRoutineFolderSchema>;
