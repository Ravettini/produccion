import { api, getAuthToken, getApiBase, setAuthToken } from "./client";

/** Genera un brief con IA a partir del evento y propuestas aprobadas. La API key y el modelo se configuran en apps/api/.env */
export async function generarBriefIA(eventId: string): Promise<{ brief: string }> {
  return api<{ brief: string }>(`/events/${eventId}/generar-brief-ia`, {
    method: "POST",
  });
}

async function downloadBriefDocx(path: string, filename: string): Promise<void> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${getApiBase()}${path}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    if (res.status === 401) {
      setAuthToken(null);
    }
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

/** Descarga el brief como DOCX (modelo audiovisual: cobertura y piezas de comunicación) */
export async function exportarBriefDocx(eventId: string, filename: string): Promise<void> {
  return downloadBriefDocx(`/events/${eventId}/exportar-brief-docx`, filename);
}

/** Brief reducido para AC (Área de Comunicación) */
export async function exportarBriefAcDocx(eventId: string, filename: string): Promise<void> {
  return downloadBriefDocx(`/events/${eventId}/exportar-brief-ac-docx`, filename);
}
