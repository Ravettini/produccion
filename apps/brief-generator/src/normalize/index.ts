import type { BriefInput, ProposalInput } from "../schemas/index.js";

const MESES_ES: Record<number, string> = {
  1: "enero", 2: "febrero", 3: "marzo", 4: "abril", 5: "mayo", 6: "junio",
  7: "julio", 8: "agosto", 9: "septiembre", 10: "octubre", 11: "noviembre", 12: "diciembre",
};

export function trimOrNull(s: string | null | undefined): string | null {
  if (s == null || s === undefined) return null;
  const t = String(s).trim();
  return t === "" ? null : t;
}

export function formatFechaEsAR(dateStr: string | null | undefined): string {
  const s = trimOrNull(dateStr);
  if (!s) return "Por confirmar";
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return s;
  const [, y, m, d] = match;
  const mes = MESES_ES[parseInt(m, 10)] ?? m;
  return `${parseInt(d, 10)} de ${mes} de ${y}`;
}

export function formatPublico(p: string | null | undefined): string {
  const s = trimOrNull(p);
  if (!s) return "Por confirmar";
  if (s === "EXTERNO") return "Externo";
  if (s === "INTERNO") return "Interno";
  if (s === "MIXTO") return "Mixto";
  return s;
}

export function normalizeProposal(p: ProposalInput): ProposalInput & { datosExtra: Record<string, unknown> } {
  const datosExtra = (p.datosExtra && typeof p.datosExtra === "object")
    ? (p.datosExtra as Record<string, unknown>)
    : {};
  const normalized: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(datosExtra)) {
    if (v != null && v !== "") {
      normalized[k] = typeof v === "string" ? v.trim() : v;
    }
  }
  return {
    ...p,
    titulo: trimOrNull(p.titulo) ?? "",
    descripcion: trimOrNull(p.descripcion) ?? "",
    nombreProyecto: trimOrNull(p.nombreProyecto),
    datosExtra: normalized,
  };
}

export function normalizeInput(input: BriefInput): BriefInput {
  return {
    event: {
      ...input.event,
      titulo: trimOrNull(input.event.titulo) ?? "",
      descripcion: trimOrNull(input.event.descripcion) ?? "",
      areaSolicitante: trimOrNull(input.event.areaSolicitante) ?? "",
      usuarioSolicitante: trimOrNull(input.event.usuarioSolicitante),
      lugar: trimOrNull((input.event as { lugar?: string | null }).lugar),
      programa: trimOrNull((input.event as { programa?: string | null }).programa),
      funcionario: trimOrNull((input.event as { funcionario?: string | null }).funcionario),
      datosProduccion: (input.event as { datosProduccion?: Record<string, unknown> | null }).datosProduccion ?? null,
    },
    proposals: input.proposals.map(normalizeProposal),
  };
}
