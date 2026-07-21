import { apiRequest } from "./client";
import type { AuthUser } from "../types/api";

export const getCurrentUser = () => apiRequest<AuthUser>("/auth/me");
export const login = (email: string, password: string) =>
  apiRequest<AuthUser>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
export const register = (email: string, password: string, displayName: string) =>
  apiRequest<AuthUser>("/auth/register", { method: "POST", body: JSON.stringify({ email, password, displayName }) });
export const logout = () => apiRequest<null>("/auth/logout", { method: "POST" });
