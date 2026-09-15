import { api } from "./client";
import type { Event } from "../types";

export type EventWithAcreditappWarning = Event & { acreditappWarning?: string };

export async function listEvents(): Promise<Event[]> {
  return api<Event[]>("/events");
}

export async function getEvent(id: string): Promise<Event> {
  return api<Event>(`/events/${id}`);
}

export async function createEvent(
  data: Partial<Event> &
    Pick<Event, "titulo" | "descripcion" | "tipoEvento" | "areaSolicitante" | "fechaTentativa">
): Promise<EventWithAcreditappWarning> {
  return api<EventWithAcreditappWarning>("/events", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateEvent(
  id: string,
  data: Partial<Event>
): Promise<EventWithAcreditappWarning> {
  return api<EventWithAcreditappWarning>(`/events/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteEvent(id: string): Promise<void> {
  return api(`/events/${id}`, { method: "DELETE" });
}

/** Duplicar un evento existente (copia operativa sin decisiones ni acreditación previa). */
export async function cloneEvent(id: string): Promise<EventWithAcreditappWarning> {
  return api<EventWithAcreditappWarning>(`/events/${id}/clone`, {
    method: "POST",
  });
}

/** Crear o reintentar el evento remoto en Acreditapp. */
export async function syncAcreditappEvent(
  eventId: string
): Promise<{ linkAcreditacionConvocados: string | null }> {
  return api<{ linkAcreditacionConvocados: string | null }>(
    `/events/${eventId}/sync-acreditapp`,
    { method: "POST" }
  );
}

/** Consultar convocados / asistidos desde Acreditapp. */
export async function getAcreditappStats(
  eventId: string
): Promise<{ convocados: number; asistidos: number; id: string; name?: string }> {
  return api(`/events/${eventId}/acreditapp-stats`);
}
