import { prisma } from "../db/prisma.js";

export class ExerciseRepository {
  async distinctExercises(search?: string) {
    const rows = await prisma.exercise.groupBy({
      by: ["hevyExerciseTemplateId", "title"],
      where: search ? { title: { contains: search, mode: "insensitive" } } : undefined,
      _count: { hevyExerciseTemplateId: true },
      orderBy: { title: "asc" },
    });

    return rows.map((row) => ({
      hevyExerciseTemplateId: row.hevyExerciseTemplateId,
      title: row.title,
      timesPerformed: row._count.hevyExerciseTemplateId,
    }));
  }
}
