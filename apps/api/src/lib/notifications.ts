import { prisma } from "./prisma.js";
import { isMailEnabled, mailErrorMessage, sendMail, type MailEventLike } from "./mail.js";

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (char) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

/** Comparación semántica: objetos JSON, null/vacío y fechas no generan ruido. */
function comparable(value: unknown): string {
  if (value == null || value === "") return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return JSON.stringify(value.map(comparable));
  if (typeof value === "object") return JSON.stringify(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => [key, comparable(val)]));
  return String(value);
}

const LABELS: Record<string, string> = {
  titulo: "Título", descripcion: "Descripción", tipoEvento: "Requerimientos", areaSolicitante: "Área solicitante",
  fechaTentativa: "Fecha", estado: "Estado", resumen: "Resumen", publico: "Público", usuarioSolicitante: "Referente",
  lugar: "Lugar", programa: "Programa", funcionario: "Funcionarios", productor: "Responsable de Producción",
  necesitaAcreditacion: "Acreditación", linkAcreditacionConvocados: "Enlace de acreditación",
  motivoCancelacion: "Motivo de cancelación", realizacionAsistentes: "Asistentes", realizacionConvocados: "Convocados",
  realizacionImpacto: "Impacto", realizacionLinkImpacto: "Enlace de impacto", datosProduccion: "Datos del evento",
  nombreProyecto: "Proyecto", categoria: "Categoría", impacto: "Impacto", datosExtra: "Datos del requerimiento",
};

export function describeChanges(before: Record<string, unknown>, updates: Record<string, unknown>): string[] {
  const normalize = (key: string, value: unknown) => {
    if (["datosProduccion", "datosExtra"].includes(key) && typeof value === "string") {
      try { return comparable(JSON.parse(value)); } catch { /* conservar JSON inválido como texto */ }
    }
    return comparable(value);
  };
  const format = (value: unknown) => value == null || value === "" ? "Sin indicar"
    : value instanceof Date ? value.toISOString().slice(0, 10)
    : typeof value === "object" ? JSON.stringify(value) : String(value);
  return Object.entries(updates).filter(([key, value]) => normalize(key, before[key]) !== normalize(key, value))
    .map(([key, value]) => `${LABELS[key] ?? key}: ${format(before[key])} → ${format(value)}`);
}

/** Una llamada por acción humana ya guardada; nunca bloquea ni revierte el guardado. */
export function notifySavedChange(eventOrId: MailEventLike | string, userId: string, action: string, changes: string[] = []): void {
  if (!isMailEnabled()) return;
  void (async () => {
    const event = typeof eventOrId === "string"
      ? await prisma.event.findUnique({ where: { id: eventOrId } }) : eventOrId;
    if (!event) return;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
    const actor = user?.name || user?.email || userId;
    const base = (process.env.PUBLIC_URL ?? "").trim().replace(/\/$/, "");
    const url = `${base}/events/${encodeURIComponent(String(event.id))}`;
    const lines = [action, `Evento: ${event.titulo}`, `Autor: ${actor}`, `Área: ${event.areaSolicitante ?? "—"}`,
      `Fecha: ${event.fechaTentativa instanceof Date ? event.fechaTentativa.toISOString().slice(0, 10) : String(event.fechaTentativa ?? "—").slice(0, 10)}`,
      `Requerimientos: ${event.tipoEvento ?? "—"}`, `Estado: ${event.estado ?? "—"}`, ...changes, `Abrir evento: ${url}`];
    await sendMail({
      event: event as MailEventLike,
      subject: `[Agendapp] ${action}: ${String(event.titulo).replace(/[\r\n]/g, " ")}`,
      text: lines.join("\n"),
      html: `<div style="font-family:system-ui,sans-serif;color:#0f172a">${lines.slice(0, -1)
        .map((line) => `<p style="white-space:pre-wrap">${escapeHtml(line)}</p>`).join("")}
        <p><a href="${escapeHtml(url)}">Abrir evento en Agendapp</a></p></div>`,
    });
  })().catch((error) => console.error("[mail] Error al preparar notificación:", mailErrorMessage(error)));
}
