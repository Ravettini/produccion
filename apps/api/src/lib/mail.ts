/**
 * Notificaciones por email (Gmail SMTP).
 * No bloquea la API: fallos se loguean y se ignoran.
 */
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

export type MailEventLike = {
  id: string;
  titulo: string;
  areaSolicitante?: string | null;
  fechaTentativa?: Date | string | null;
  estado?: string | null;
  tipoEvento?: string | null;
};

let transporter: Transporter | null = null;

function envFlagTrue(value: string | undefined, defaultTrue = true): boolean {
  if (value == null || value.trim() === "") return defaultTrue;
  const v = value.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "si" || v === "sí";
}

export function isMailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim() &&
      (process.env.NOTIFY_EMAIL_TO?.trim() || process.env.SMTP_USER?.trim())
  );
}

export function isMailEnabled(): boolean {
  return envFlagTrue(process.env.NOTIFY_EMAIL_ENABLED, true) && isMailConfigured();
}

function getTransporter(): Transporter | null {
  if (!isMailConfigured()) return null;
  if (transporter) return transporter;

  const port = Number(process.env.SMTP_PORT ?? 465);
  const secure =
    process.env.SMTP_SECURE == null || process.env.SMTP_SECURE === ""
      ? port === 465
      : envFlagTrue(process.env.SMTP_SECURE, true);

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!.trim(),
    port: Number.isFinite(port) ? port : 465,
    secure,
    auth: {
      user: process.env.SMTP_USER!.trim(),
      // Gmail App Passwords a veces se copian con espacios
      pass: process.env.SMTP_PASS!.replace(/\s+/g, ""),
    },
  });
  return transporter;
}

function publicEventUrl(eventId: string): string {
  const base = (process.env.PUBLIC_URL ?? "").trim().replace(/\/$/, "");
  return base ? `${base}/events/${eventId}` : `/events/${eventId}`;
}

function formatFecha(value: Date | string | null | undefined): string {
  if (!value) return "—";
  if (value instanceof Date) {
    const iso = value.toISOString();
    return iso.slice(0, 10);
  }
  const s = String(value);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m?.[1] ?? s;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendMail(opts: {
  subject: string;
  text: string;
  html?: string;
}): Promise<boolean> {
  if (!isMailEnabled()) {
    if (!isMailConfigured()) {
      console.warn("[mail] Omitido: SMTP no configurado (SMTP_USER / SMTP_PASS).");
    }
    return false;
  }

  const tx = getTransporter();
  if (!tx) return false;

  const recipients = resolveNotifyRecipients();
  if (recipients.length === 0) {
    console.warn("[mail] Omitido: sin destinatarios (NOTIFY_EMAIL_TO / INSTITUCIONALES).");
    return false;
  }
  const from = (process.env.NOTIFY_EMAIL_FROM || process.env.SMTP_USER || recipients[0]).trim();

  try {
    await tx.sendMail({
      from,
      to: recipients.join(", "),
      subject: opts.subject,
      text: opts.text,
      html: opts.html ?? undefined,
    });
    return true;
  } catch (err) {
    console.error("[mail] Error al enviar:", err instanceof Error ? err.message : err);
    return false;
  }
}

/** Destinatarios: NOTIFY_EMAIL_TO (+ opc. INSTITUCIONALES), separados por coma. */
function resolveNotifyRecipients(): string[] {
  const chunks = [
    process.env.NOTIFY_EMAIL_TO,
    process.env.NOTIFY_EMAIL_INSTITUCIONALES,
    process.env.SMTP_USER,
  ];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const chunk of chunks) {
    if (!chunk?.trim()) continue;
    for (const part of chunk.split(/[,;]+/)) {
      const email = part.trim().toLowerCase();
      if (!email || !email.includes("@") || seen.has(email)) continue;
      seen.add(email);
      out.push(email);
    }
  }
  return out;
}

function eventSummaryLines(event: MailEventLike): string[] {
  return [
    `Título: ${event.titulo}`,
    `Área: ${event.areaSolicitante ?? "—"}`,
    `Fecha: ${formatFecha(event.fechaTentativa)}`,
    `Tipo: ${event.tipoEvento ?? "—"}`,
    `Estado: ${event.estado ?? "—"}`,
    `Link: ${publicEventUrl(event.id)}`,
  ];
}

function eventSummaryHtml(event: MailEventLike): string {
  const rows = [
    ["Título", event.titulo],
    ["Área", event.areaSolicitante ?? "—"],
    ["Fecha", formatFecha(event.fechaTentativa)],
    ["Tipo", event.tipoEvento ?? "—"],
    ["Estado", event.estado ?? "—"],
  ];
  const body = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#64748b">${escapeHtml(k!)}</td><td style="padding:4px 0;font-weight:600">${escapeHtml(String(v))}</td></tr>`
    )
    .join("");
  const url = publicEventUrl(event.id);
  return `<div style="font-family:system-ui,sans-serif;font-size:14px;color:#0f172a">
  <table style="border-collapse:collapse">${body}</table>
  <p style="margin-top:16px"><a href="${escapeHtml(url)}">Abrir evento en Agendapp</a></p>
</div>`;
}

/** Fire-and-forget wrapper: never throws to callers. */
function fire(promise: Promise<boolean>, label: string): void {
  void promise.catch((err) => {
    console.error(`[mail] ${label}:`, err instanceof Error ? err.message : err);
  });
}

export function notifyEventCreated(event: MailEventLike): void {
  const subject = `[Agendapp] Nuevo evento: ${event.titulo}`;
  const text = ["Se creó un evento nuevo en Agendapp.", "", ...eventSummaryLines(event)].join("\n");
  const html = `<p>Se creó un evento nuevo en Agendapp.</p>${eventSummaryHtml(event)}`;
  fire(sendMail({ subject, text, html }), "notifyEventCreated");
}

export function notifyEventStatusChanged(
  event: MailEventLike,
  fromEstado: string,
  toEstado: string
): void {
  const subject = `[Agendapp] Estado ${fromEstado} → ${toEstado}: ${event.titulo}`;
  const text = [
    `El estado del evento cambió de ${fromEstado} a ${toEstado}.`,
    "",
    ...eventSummaryLines({ ...event, estado: toEstado }),
  ].join("\n");
  const html = `<p>El estado del evento cambió de <strong>${escapeHtml(fromEstado)}</strong> a <strong>${escapeHtml(toEstado)}</strong>.</p>${eventSummaryHtml({ ...event, estado: toEstado })}`;
  fire(sendMail({ subject, text, html }), "notifyEventStatusChanged");
}

export function notifyAreaDecision(
  event: MailEventLike,
  areaRole: string,
  decision: "APPROVED" | "REJECTED",
  reason?: string | null
): void {
  const label = decision === "APPROVED" ? "aprobó" : "rechazó";
  const subject = `[Agendapp] ${areaRole} ${label}: ${event.titulo}`;
  const lines = [
    `El área ${areaRole} ${label} el evento.`,
    reason ? `Motivo: ${reason}` : null,
    "",
    ...eventSummaryLines(event),
  ].filter((l): l is string => l != null);
  const html = `<p>El área <strong>${escapeHtml(areaRole)}</strong> ${label} el evento.</p>${
    reason ? `<p><em>Motivo:</em> ${escapeHtml(reason)}</p>` : ""
  }${eventSummaryHtml(event)}`;
  fire(sendMail({ subject, text: lines.join("\n"), html }), "notifyAreaDecision");
}
