import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../db/prisma.js";

export type WorkoutListParams = {
  search?: string;
  sortBy: "startTime" | "title";
  sortDir: "asc" | "desc";
  page: number;
  pageSize: number;
};

export type NormalizedWorkout = {
  hevyId: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  hevyCreatedAt: Date;
  hevyUpdatedAt: Date;
  exercises: {
    hevyExerciseTemplateId: string;
    title: string;
    notes: string | null;
    exerciseIndex: number;
    supersetId: number | null;
    sets: {
      setIndex: number;
      setType: string;
      weightKg: number | null;
      reps: number | null;
      distanceMeters: number | null;
      durationSeconds: number | null;
      rpe: number | null;
    }[];
  }[];
};

export class WorkoutRepository {
  constructor(private db: PrismaClient = prisma) {}

  countAll() {
    return this.db.workout.count();
  }

  async list(params: WorkoutListParams) {
    const where: Prisma.WorkoutWhereInput = params.search
      ? { title: { contains: params.search, mode: "insensitive" } }
      : {};
    const orderBy =
      params.sortBy === "title"
        ? { title: params.sortDir }
        : { startTime: params.sortDir };

    const [items, total] = await this.db.$transaction([
      this.db.workout.findMany({
        where,
        orderBy,
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        include: { exercises: { include: { sets: true } } },
      }),
      this.db.workout.count({ where }),
    ]);

    return { items, total };
  }

  findRecent(limit = 5) {
    return this.db.workout.findMany({
      orderBy: { startTime: "desc" },
      take: limit,
      include: { exercises: { include: { sets: true } } },
    });
  }

  findById(id: string) {
    return this.db.workout.findUnique({
      where: { id },
      include: {
        exercises: {
          orderBy: { exerciseIndex: "asc" },
          include: { sets: { orderBy: { setIndex: "asc" } } },
        },
      },
    });
  }

  findByHevyId(hevyId: string) {
    return this.db.workout.findUnique({ where: { hevyId } });
  }

  deleteByHevyId(hevyId: string) {
    return this.db.workout.deleteMany({ where: { hevyId } });
  }

  async upsertNormalized(workout: NormalizedWorkout) {
    const existing = await this.findByHevyId(workout.hevyId);
    if (existing && existing.hevyUpdatedAt.getTime() === workout.hevyUpdatedAt.getTime()) {
      return { action: "skipped" as const, workout: existing };
    }

    const saved = await this.db.$transaction(async (tx) => {
      const row = await tx.workout.upsert({
        where: { hevyId: workout.hevyId },
        update: {
          title: workout.title,
          description: workout.description,
          startTime: workout.startTime,
          endTime: workout.endTime,
          hevyCreatedAt: workout.hevyCreatedAt,
          hevyUpdatedAt: workout.hevyUpdatedAt,
        },
        create: {
          hevyId: workout.hevyId,
          title: workout.title,
          description: workout.description,
          startTime: workout.startTime,
          endTime: workout.endTime,
          hevyCreatedAt: workout.hevyCreatedAt,
          hevyUpdatedAt: workout.hevyUpdatedAt,
        },
      });

      await tx.exercise.deleteMany({ where: { workoutId: row.id } });
      for (const exercise of workout.exercises) {
        await tx.exercise.create({
          data: {
            workoutId: row.id,
            hevyExerciseTemplateId: exercise.hevyExerciseTemplateId,
            title: exercise.title,
            notes: exercise.notes,
            exerciseIndex: exercise.exerciseIndex,
            supersetId: exercise.supersetId,
            sets: { create: exercise.sets },
          },
        });
      }
      return row;
    });

    return { action: existing ? ("updated" as const) : ("created" as const), workout: saved };
  }
}
