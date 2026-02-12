import { api, getAuthToken } from "./client";

const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000";

/** Genera un brief con IA a partir del evento y propuestas aprobadas. La API key y el modelo se configuran en apps/api/.env */
export async function generarBriefIA(eventId: string): Promise<{ brief: string }> {
  return api<{ brief: string }>(`/events/${eventId}/generar-brief-ia`, {
    method: "POST",
  });
}

/** Descarga el brief como DOCX (formato BRIEF ESTRATÉGICO con colores y estructura) */
export async function exportarBriefDocx(eventId: string, filename: string): Promise<void> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}/events/${eventId}/exportar-brief-docx`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.detail ?? err.error ?? "Error al exportar");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".docx") ? filename : `${filename}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
