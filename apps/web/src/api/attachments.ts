import { getAuthToken } from "./client";

const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000";

export interface EventAttachment {
  id: string;
  eventId: string;
  originalName: string;
  storedPath: string;
  mimeType: string;
  size?: number | null;
  tipo?: string | null; // "documento" | "impacto"
  createdAt: string;
}

export async function listAttachments(eventId: string): Promise<EventAttachment[]> {
  const token = getAuthToken();
  const res = await fetch(`${BASE}/events/${eventId}/attachments`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || String(res.status));
  }
  return res.json();
}

export async function uploadAttachment(eventId: string, file: File, tipo: "documento" | "impacto" = "documento"): Promise<EventAttachment> {
  const token = getAuthToken();
  const form = new FormData();
  form.append("file", file);
  form.append("tipo", tipo);
  const res = await fetch(`${BASE}/events/${eventId}/attachments`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || String(res.status));
  }
  return res.json();
}

/** Descarga el PDF usando fetch con auth */
export function openAttachment(eventId: string, attachmentId: string, filename: string): void {
  const token = getAuthToken();
  const url = `${BASE}/events/${eventId}/attachments/${attachmentId}/download`;
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  fetch(url, { headers })
    .then((r) => r.blob())
    .then((blob) => {
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      a.target = "_blank";
      a.click();
      URL.revokeObjectURL(objectUrl);
    });
}

export async function deleteAttachment(eventId: string, attachmentId: string): Promise<void> {
  const token = getAuthToken();
  const res = await fetch(`${BASE}/events/${eventId}/attachments/${attachmentId}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || String(res.status));
  }
}
