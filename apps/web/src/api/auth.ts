import { api, setAuthToken } from "./client";
import type { User } from "../types";

export async function login(email: string, password: string): Promise<{ token: string; user: User }> {
  const r = await api<{ token: string; user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setAuthToken(r.token);
  return r;
}

export async function me(): Promise<User> {
  return api<User>("/auth/me");
}

export function logout() {
  setAuthToken(null);
}
