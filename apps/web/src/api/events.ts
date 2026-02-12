import { api } from "./client";
import type { Event } from "../types";

export async function listEvents(): Promise<Event[]> {
  return api<Event[]>("/events");
}

export async function getEvent(id: string): Promise<Event> {
  return api<Event>(`/events/${id}`);
}

export async function createEvent(data: Partial<Event> & Pick<Event, "titulo" | "descripcion" | "tipoEvento" | "areaSolicitante" | "fechaTentativa">): Promise<Event> {
  return api<Event>("/events", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateEvent(id: string, data: Partial<Event>): Promise<Event> {
  return api<Event>(`/events/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteEvent(id: string): Promise<void> {
  return api(`/events/${id}`, { method: "DELETE" });
}
