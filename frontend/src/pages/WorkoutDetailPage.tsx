import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { ExerciseCard } from "../components/workouts/ExerciseCard";
import { useWorkoutDetail } from "../hooks/useWorkouts";
import { formatDateTime } from "../utils/format";

export function WorkoutDetailPage() {
  const { id = "" } = useParams();
  const workout = useWorkoutDetail(id);

  if (workout.isLoading) return <LoadingState label="Loading workout" />;
  if (workout.isError) return <ErrorState message={workout.error.message} onRetry={() => workout.refetch()} />;

  const data = workout.data?.data;
  if (!data) return <EmptyState title="Workout not found" />;

  return (
    <div className="grid gap-5">
      <Link className="focus-ring inline-flex w-fit items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm" to="/workouts">
        <ArrowLeft size={16} />
        Workouts
      </Link>
      <section className="border-b border-line pb-4">
        <h2 className="text-2xl font-semibold">{data.title}</h2>
        <p className="mt-1 text-sm text-slate-600">
          {formatDateTime(data.startTime)} to {formatDateTime(data.endTime)}
        </p>
        {data.description ? <p className="mt-3 max-w-3xl text-slate-700">{data.description}</p> : null}
      </section>
      <div className="grid gap-4">
        {data.exercises.map((exercise) => (
          <ExerciseCard exercise={exercise} key={exercise.id} />
        ))}
      </div>
    </div>
  );
}
