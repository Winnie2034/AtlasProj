import { ExerciseRepository } from "../repositories/exercise.repository.js";

export class ExercisesService {
  constructor(private exercises = new ExerciseRepository()) {}

  list(query: Record<string, unknown>) {
    return this.exercises.distinctExercises(typeof query.search === "string" ? query.search : undefined);
  }
}
