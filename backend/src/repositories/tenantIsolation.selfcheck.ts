import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "../db/prisma.js";
import { WorkoutRepository } from "./workout.repository.js";

const suffix = randomUUID();
const [alice, bob] = await Promise.all([
  prisma.user.create({ data: { email: `alice-${suffix}@example.test` } }),
  prisma.user.create({ data: { email: `bob-${suffix}@example.test` } }),
]);

try {
  const now = new Date();
  const bobWorkout = await prisma.workout.create({
    data: {
      userId: bob.id,
      hevyId: `bob-${suffix}`,
      title: "Bob only",
      startTime: now,
      endTime: now,
      hevyCreatedAt: now,
      hevyUpdatedAt: now,
    },
  });
  const workouts = new WorkoutRepository();
  assert.equal(await workouts.countAll(alice.id), 0);
  assert.equal(await workouts.countAll(bob.id), 1);
  assert.equal(await workouts.findById(alice.id, bobWorkout.id), null);
  assert.equal((await workouts.findById(bob.id, bobWorkout.id))?.id, bobWorkout.id);
  console.log("tenant-isolation self-check passed");
} finally {
  await prisma.user.deleteMany({ where: { id: { in: [alice.id, bob.id] } } });
  await prisma.$disconnect();
}
