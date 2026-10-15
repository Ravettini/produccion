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

export function mailErrorMessage(error: unknown): string {
  let message = error instanceof Error ? error.message : String(error);
  const password = process.env.SMTP_PASS;
  for (const secret of [password, password?.replace(/\s+/g, "")]) {
    if (secret) message = message.split(secret).join("[redactado]");
  }
  return message;
}

export function isMailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim()
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

export async function sendMail(opts: {
  event: MailEventLike;
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

  const recipients = resolveNotifyRecipients(opts.event);
  if (recipients.length === 0) {
    console.warn("[mail] Omitido: sin destinatarios (NOTIFY_EMAIL_TO / INSTITUCIONALES).");
    return false;
  }
  const from = (process.env.NOTIFY_EMAIL_FROM || process.env.SMTP_USER || recipients[0]).trim();

  try {
    const result = await tx.sendMail({
      from,
      to: recipients.join(", "),
      subject: opts.subject,
      text: opts.text,
      html: opts.html ?? undefined,
    });
    console.info("[mail] Respuesta SMTP", {
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
    });
    if (result.rejected?.length) console.warn("[mail] Destinatarios rechazados por SMTP", result.rejected);
    if (result.accepted?.length === 0) return false;
    return true;
  } catch (err) {
    console.error("[mail] Error al enviar:", mailErrorMessage(err));
    return false;
  }
}

/** Las credenciales del remitente nunca son una suscripción. */
export function resolveNotifyRecipients(event: Pick<MailEventLike, "tipoEvento">): string[] {
  const soloInformar = /solo\s+informar/i.test(event.tipoEvento ?? "");
  const chunks = [
    ...(soloInformar ? [] : [process.env.NOTIFY_EMAIL_PRODUCCION ?? process.env.NOTIFY_EMAIL_TO]),
    process.env.NOTIFY_EMAIL_INSTITUCIONALES,
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
