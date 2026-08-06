/**
 * Genera/actualiza tarjetas de requerimiento (SUBMITTED) a partir del
 * tipo de evento y datosProduccion cargados en el formulario.
 */
import { prisma } from "./prisma.js";

type Datos = Record<string, string>;

function parseDatos(raw: unknown): Datos {
  if (raw == null) return {};
  if (typeof raw === "object" && !Array.isArray(raw)) {
    const out: Datos = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (v != null && String(v).trim() !== "") out[k] = String(v);
    }
    return out;
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      return parseDatos(JSON.parse(raw));
    } catch {
      return {};
    }
  }
  return {};
}

function tipoIncludes(tipoEvento: string, kw: string): boolean {
  return String(tipoEvento)
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .some((p) => p.includes(kw));
}

function line(label: string, value?: string | null): string | null {
  const v = value?.trim();
  if (!v || v === "—" || v === "no") return null;
  if (v === "si") return `${label}: Sí`;
  return `${label}: ${v}`;
}

function formatMaterialesExtra(dp: Datos): string | null {
  const items = (dp.materialesExtra ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (items.length === 0) return null;

  let cantidades: Record<string, string> = {};
  const raw = dp.materialesExtraCantidades?.trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        cantidades = parsed as Record<string, string>;
      }
    } catch {
      cantidades = {};
    }
  }

  return items
    .map((item) => {
      const qty = cantidades[item]?.trim();
      return qty ? `${item} × ${qty}` : item;
    })
    .join(", ");
}

function buildProduccionDescription(dp: Datos, lugar?: string | null): string {
  const lines = [
    line("Locaciones posibles", dp.locacionesPosibles),
    line("Lugar confirmado", lugar),
    line("Personas", dp.cantidadPersonas),
    line("Convocatoria", dp.horarioConvocatoria),
    line("Comienzo", dp.horarioComienzo),
    line("Finalización", dp.horarioFinalizacion),
    line("Pantalla LED", dp.pantallaLED),
    line("Cant. pantallas LED", dp.pantallaLEDCantidad),
    line("Pantalla para proyector", dp.pantallaRetractil),
    line("Proyector", dp.proyector),
    line("Sonido", dp.sonido),
    line("Micrófonos", dp.microfonos),
    line("Cant. micrófonos", dp.microfonosCantidad),
    line("Equipamiento", dp.equipamiento),
    line("Req. técnicos", dp.requerimientosTecnicos),
    line("Materiales extra", formatMaterialesExtra(dp)),
    line("Materiales (otro)", dp.materialesExtraOtro),
    line("WiFi", dp.requiereWifi),
    line("Accesibilidad", dp.requiereAccesibilidad),
    line("Técnica", dp.requiereTecnica),
    line("Estacionamiento", dp.requiereEstacionamiento),
    line("Espacio de Back", dp.requiereBackstage),
    line("Mobiliario", dp.requiereMobiliario),
  ].filter(Boolean);
  return lines.length > 0 ? lines.join("\n") : "Solicitud de producción del evento.";
}

function buildCateringDescription(dp: Datos): string {
  const lines = [
    line("Tipo", dp.tipoCatering),
    line("Cantidad de personas", dp.cateringCantidad || dp.cantidadPersonas),
    line("Restricciones", dp.restriccionesAlimentarias),
  ].filter(Boolean);
  return lines.length > 0 ? lines.join("\n") : "Solicitud de catering.";
}

function buildCoberturaDescription(dp: Datos): string {
  const lines = [
    line("Objetivo", dp.coberturaObjetivo),
    line("Canal(es)", dp.comunicacionMedio),
    line("Instagram", dp.comunicacionInstagram),
    line("Instagram (otro)", dp.comunicacionInstagramOtro),
    line("LinkedIn", dp.comunicacionLinkedin),
    line("LinkedIn (otro)", dp.comunicacionLinkedinOtro),
    line("Duración", dp.coberturaDuracion),
    line("Formato", dp.coberturaFormato),
    line("Orientación", dp.coberturaOrientacion),
    line("Contacto lugar", dp.referenteLugarContacto),
  ].filter(Boolean);
  return lines.length > 0 ? lines.join("\n") : "Solicitud de cobertura audiovisual.";
}

const PROD_EXTRA_KEYS = [
  "locacionesPosibles",
  "horarioConvocatoria",
  "horarioComienzo",
  "horarioFinalizacion",
  "cantidadPersonas",
  "pantallaLED",
  "pantallaLEDCantidad",
  "pantallaRetractil",
  "proyector",
  "sonido",
  "microfonos",
  "microfonosCantidad",
  "equipamiento",
  "requerimientosTecnicos",
  "materialesExtra",
  "materialesExtraCantidades",
  "materialesExtraOtro",
  "requiereWifi",
  "requiereAccesibilidad",
  "requiereTecnica",
  "requiereEstacionamiento",
  "requiereBackstage",
  "requiereMobiliario",
] as const;

const CATERING_EXTRA_KEYS = [
  "catering",
  "tipoCatering",
  "cateringCantidad",
  "restriccionesAlimentarias",
  "cantidadPersonas",
] as const;

const COBERTURA_EXTRA_KEYS = [
  "coberturaObjetivo",
  "comunicacionMedio",
  "comunicacionInstagram",
  "comunicacionInstagramOtro",
  "comunicacionLinkedin",
  "comunicacionLinkedinOtro",
  "coberturaDuracion",
  "coberturaFormato",
  "coberturaOrientacion",
  "referenteLugarContacto",
] as const;

function pick(dp: Datos, keys: readonly string[]): Datos {
  const out: Datos = {};
  for (const k of keys) {
    if (dp[k]?.trim()) out[k] = dp[k];
  }
  return out;
}

async function upsertSubmittedProposal(opts: {
  eventId: string;
  userId: string;
  categoria: string;
  titulo: string;
  descripcion: string;
  datosExtra: Datos;
}): Promise<void> {
  const existingList = await prisma.proposal.findMany({
    where: { eventId: opts.eventId, categoria: opts.categoria },
  });
  const existing = existingList[0] as
    | { id: string; estado: string }
    | undefined;

  const datosExtraStr =
    Object.keys(opts.datosExtra).length > 0 ? JSON.stringify(opts.datosExtra) : null;

  if (existing) {
    if (["APPROVED", "REJECTED", "CANCELLED"].includes(existing.estado)) {
      return;
    }
    await prisma.proposal.update({
      where: { id: existing.id },
      data: {
        titulo: opts.titulo,
        descripcion: opts.descripcion,
        datosExtra: datosExtraStr,
        estado: existing.estado === "DRAFT" ? "SUBMITTED" : existing.estado,
      },
    });
    if (existing.estado === "DRAFT") {
      await prisma.proposalAudit.create({
        data: {
          proposalId: existing.id,
          userId: opts.userId,
          action: "SUBMIT",
          fromStatus: "DRAFT",
          toStatus: "SUBMITTED",
        },
      });
    }
    return;
  }

  const created = await prisma.proposal.create({
    data: {
      eventId: opts.eventId,
      titulo: opts.titulo,
      descripcion: opts.descripcion,
      categoria: opts.categoria,
      impacto: "MEDIO",
      datosExtra: datosExtraStr,
      estado: "SUBMITTED",
      createdById: opts.userId,
    },
  });
  const createdId = String((created as { id: unknown }).id);
  await prisma.proposalAudit.create({
    data: {
      proposalId: createdId,
      userId: opts.userId,
      action: "CREATE",
      toStatus: "SUBMITTED",
    },
  });
}

function buildInstitucionalesDescription(opts: {
  funcionario?: string | null;
  programa?: string | null;
  lugar?: string | null;
  dp: Datos;
}): string {
  const lines = [
    line("Funcionario(s)", opts.funcionario),
    line("Programa", opts.programa),
    line("Lugar", opts.lugar),
    line("Convocatoria", opts.dp.horarioConvocatoria),
    line("Comienzo", opts.dp.horarioComienzo),
    line("Finalización", opts.dp.horarioFinalizacion),
  ].filter(Boolean);
  return lines.length > 0
    ? lines.join("\n")
    : "Solicitud de acompañamiento institucional / agenda.";
}

export async function syncProposalsFromEvent(opts: {
  eventId: string;
  userId: string;
  tipoEvento: string;
  lugar?: string | null;
  funcionario?: string | null;
  programa?: string | null;
  datosProduccion?: unknown;
}): Promise<void> {
  const dp = parseDatos(opts.datosProduccion);
  const hasProd =
    tipoIncludes(opts.tipoEvento, "produccion") || tipoIncludes(opts.tipoEvento, "producción");
  const hasInsti = tipoIncludes(opts.tipoEvento, "institucional");
  const hasCobertura =
    tipoIncludes(opts.tipoEvento, "cobertura") || tipoIncludes(opts.tipoEvento, "comunicacion");
  const wantsCatering = dp.catering === "si";

  if (hasProd) {
    await upsertSubmittedProposal({
      eventId: opts.eventId,
      userId: opts.userId,
      categoria: "PRODUCCION",
      titulo: "Producción",
      descripcion: buildProduccionDescription(dp, opts.lugar),
      datosExtra: pick(dp, PROD_EXTRA_KEYS),
    });
  }

  if (wantsCatering) {
    await upsertSubmittedProposal({
      eventId: opts.eventId,
      userId: opts.userId,
      categoria: "CATERING",
      titulo: "Catering",
      descripcion: buildCateringDescription(dp),
      datosExtra: pick(dp, CATERING_EXTRA_KEYS),
    });
  }

  if (hasInsti) {
    const datosExtra: Datos = {};
    if (opts.funcionario?.trim()) datosExtra.funcionario = opts.funcionario.trim();
    if (opts.programa?.trim()) datosExtra.programa = opts.programa.trim();
    if (opts.lugar?.trim()) datosExtra.lugar = opts.lugar.trim();
    if (dp.horarioComienzo) datosExtra.horario = `${dp.horarioComienzo}${dp.horarioFinalizacion ? ` a ${dp.horarioFinalizacion}` : ""}`;
    await upsertSubmittedProposal({
      eventId: opts.eventId,
      userId: opts.userId,
      categoria: "AGENDA",
      titulo: "Institucionales",
      descripcion: buildInstitucionalesDescription({
        funcionario: opts.funcionario,
        programa: opts.programa,
        lugar: opts.lugar,
        dp,
      }),
      datosExtra,
    });
  }

  if (hasCobertura) {
    await upsertSubmittedProposal({
      eventId: opts.eventId,
      userId: opts.userId,
      categoria: "OTRO",
      titulo: "Cobertura",
      descripcion: buildCoberturaDescription(dp),
      datosExtra: pick(dp, COBERTURA_EXTRA_KEYS),
    });
  }
}
