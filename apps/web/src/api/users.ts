import { api } from "./client";
import type { User } from "../types";

export interface AdminUser extends User {
  createdAt?: string;
}

export async function listUsers(): Promise<AdminUser[]> {
  return api<AdminUser[]>("/admin/users");
}

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  role: string;
}): Promise<{ user: User }> {
  return api<{ user: User }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateUser(
  id: string,
  data: { name?: string; role?: string; password?: string }
): Promise<AdminUser> {
  return api<AdminUser>(`/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id: string): Promise<void> {
  return api(`/admin/users/${id}`, { method: "DELETE" });
}

export interface AdminMetrics {
  totalEvents: number;
  totalProposals: number;
  eventsByStatus: Record<string, number>;
  proposalsByStatus: Record<string, number>;
  eventosPorRequerimiento?: Record<string, number>;
  eventosPorAreaSolicitante?: Record<string, number>;
  eventosPorPublico?: Record<string, number>;
  eventosPorMes?: Record<string, number>;
  tasaConversion?: number;
  eventosSinPropuestasAprobadas?: number;
  eventosConBrief?: number;
  propuestasPendientes?: number;
  eventosConfirmadosEsteMes?: number;
  eventosConfirmadosMesAnterior?: number;
  tiempoPromedioAprobacionDias?: number | null;
  tasaRechazo?: number;
  proposalsByCategory?: Record<string, number>;
  proposalsByImpact?: Record<string, number>;
  propuestasPorValidador?: Record<string, number>;
  evolucionEventos?: { mes: string; cantidad: number }[];
  evolucionPropuestas?: { mes: string; cantidad: number }[];
}

export async function getMetrics(): Promise<AdminMetrics> {
  return api<AdminMetrics>("/admin/metrics");
}

export async function vaciarApp(): Promise<{ ok: boolean; message: string }> {
  return api<{ ok: boolean; message: string }>("/admin/vaciar", {
    method: "POST",
  });
}

export interface CargarJsonResult {
  ok: boolean;
  creados: number;
  errores: number;
  detalle: { id: string; titulo: string }[];
  erroresDetalle: { index: number; error: string }[];
}

export async function cargarEventosDesdeJson(eventos: unknown[]): Promise<CargarJsonResult> {
  return api<CargarJsonResult>("/admin/cargar-json", {
    method: "POST",
    body: JSON.stringify(Array.isArray(eventos) ? eventos : [eventos]),
  });
}
