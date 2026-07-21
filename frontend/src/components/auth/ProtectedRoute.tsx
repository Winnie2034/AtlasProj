import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { ApiError } from "../../api/client";
import { ErrorState } from "../common/ErrorState";
import { LoadingState } from "../common/LoadingState";
import { useCurrentUser } from "../../hooks/useAuth";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const user = useCurrentUser();
  if (user.isLoading) return <div className="p-8"><LoadingState label="Loading Atlas" /></div>;
  if (user.error instanceof ApiError && user.error.code === "UNAUTHORIZED") return <Navigate replace to="/login" />;
  if (user.isError) return <div className="p-8"><ErrorState message={user.error.message} onRetry={() => user.refetch()} /></div>;
  return children;
}
