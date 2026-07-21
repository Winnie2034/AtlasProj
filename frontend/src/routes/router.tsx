import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { DashboardPage } from "../pages/DashboardPage";
import { RoutinesPage } from "../pages/RoutinesPage";
import { SettingsPage } from "../pages/SettingsPage";
import { WorkoutDetailPage } from "../pages/WorkoutDetailPage";
import { WorkoutListPage } from "../pages/WorkoutListPage";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    path: "/",
    element: <ProtectedRoute><AppShell /></ProtectedRoute>,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "workouts", element: <WorkoutListPage /> },
      { path: "workouts/:id", element: <WorkoutDetailPage /> },
      { path: "routines", element: <RoutinesPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);
