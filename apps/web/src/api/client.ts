/** Base de la API: vacío en producción = mismo dominio (proyecto.helio3.co). */
export function getApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_BASE as string | undefined;
  if (fromEnv !== undefined && fromEnv.trim() !== "") {
    return fromEnv.replace(/\/$/, "");
  }
  if (import.meta.env.PROD) {
    return "";
  }
  return "http://localhost:4000";
}

const BASE = getApiBase();

let token: string | null = null;

export function setAuthToken(t: string | null) {
  token = t;
  if (t) localStorage.setItem("token", t);
  else localStorage.removeItem("token");
}

export function getAuthToken(): string | null {
  if (token) return token;
  token = localStorage.getItem("token");
  return token;
}

export async function api<T>(
  path: string,
  opts: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string>),
  };
  const t = getAuthToken();
  if (t) headers["Authorization"] = `Bearer ${t}`;

  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    const msg = err.detail ? `${err.error}: ${err.detail}` : (err.error || String(res.status));
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}
