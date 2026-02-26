import type { BriefInput, ProposalInput } from "../schemas/index.js";
import { trimOrNull } from "../normalize/index.js";

const POR_CONFIRMAR = "Por confirmar";
const NO_DEFINIDO = "No definido";

export type ApprovedProposal = ProposalInput & { datosExtra: Record<string, unknown> };

export function filterApproved(proposals: ProposalInput[]): ApprovedProposal[] {
  return proposals
    .filter((p) => String(p.status).toUpperCase() === "APPROVED")
    .map((p) => ({
      ...p,
      datosExtra: (p.datosExtra && typeof p.datosExtra === "object")
        ? (p.datosExtra as Record<string, unknown>)
        : {},
    }));
}

export type CategoryKey = "LOGISTICA" | "CATERING" | "TECNICA" | "AGENDA" | "PRODUCCION" | "OTRO";

export const CATEGORY_LABELS: Record<string, string> = {
  LOGISTICA: "Logística",
  CATERING: "Catering",
  TECNICA: "Técnica",
  AGENDA: "Agenda",
  PRODUCCION: "Producción",
  OTRO: "Otro",
};

export function groupByCategory(proposals: ApprovedProposal[]): Map<CategoryKey, ApprovedProposal[]> {
  const map = new Map<CategoryKey, ApprovedProposal[]>();
  const cats: CategoryKey[] = ["LOGISTICA", "CATERING", "TECNICA", "AGENDA", "PRODUCCION", "OTRO"];
  for (const c of cats) map.set(c, []);
  for (const p of proposals) {
    const cat = (cats.includes(p.categoria as CategoryKey) ? p.categoria : "OTRO") as CategoryKey;
    map.get(cat)!.push(p);
  }
  return map;
}

export function resolveValue(val: string | null | undefined, fallback: string = POR_CONFIRMAR): string {
  const s = trimOrNull(val);
  return s ?? fallback;
}

/** Extrae número de micrófonos de texto (ej. "3 micrófonos" -> "3") */
export function extractMicrofonosCount(text: string | null | undefined): string {
  if (!text) return POR_CONFIRMAR;
  const t = String(text).toLowerCase();
  const m = t.match(/(\d+)\s*micr[oó]fono/i) || t.match(/micr[oó]fono[s]?\s*[:\s]*(\d+)/i);
  return m ? m[1]! : POR_CONFIRMAR;
}

/** Keywords para matching de items técnicos */
const TECNICA_KEYWORDS: Record<string, string[]> = {
  pantallaLED: ["pantalla led", "led", "pantalla"],
  proyector: ["proyector", "proyección", "cañón"],
  sonido: ["sonido", "audio", "parlantes", "amplificador"],
  microfonos: ["micrófono", "microfono", "micro"],
  wifi: ["wifi", "wi-fi", "conectividad", "internet"],
  streaming: ["streaming", "transmisión", "transmisión en vivo"],
};

export function matchTecnicaItem(
  proposals: ApprovedProposal[],
  itemKey: keyof typeof TECNICA_KEYWORDS
): { found: boolean; detail: string } {
  const keywords = TECNICA_KEYWORDS[itemKey];
  if (!keywords) return { found: false, detail: NO_DEFINIDO };

  const techProposals = proposals.filter((p) => p.categoria === "TECNICA" || p.categoria === "PRODUCCION");
  const allText = techProposals
    .flatMap((p) => [
      p.descripcion,
      (p.datosExtra?.equipamiento as string) ?? "",
      (p.datosExtra?.equipamientoNecesario as string) ?? "",
      (p.datosExtra?.requerimientosTecnicos as string) ?? "",
    ])
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  for (const kw of keywords) {
    if (allText.includes(kw.toLowerCase())) {
      const detail = techProposals
        .map((p) => {
          const parts = [
            p.descripcion,
            p.datosExtra?.equipamiento,
            p.datosExtra?.equipamientoNecesario,
            p.datosExtra?.requerimientosTecnicos,
          ].filter(Boolean) as string[];
          return parts.join(" ");
        })
        .join("; ");
      return { found: true, detail: trimOrNull(detail) ?? "" };
    }
  }
  return { found: false, detail: NO_DEFINIDO };
}

export function getMicrofonosCount(proposals: ApprovedProposal[]): string {
  const techProposals = proposals.filter((p) => p.categoria === "TECNICA" || p.categoria === "PRODUCCION");
  const fromStructured = techProposals
    .map((p) => p.datosExtra?.microfonosCantidad)
    .find((v) => v != null && String(v).trim() !== "");
  if (fromStructured != null && String(fromStructured).trim() !== "") return String(fromStructured).trim();
  const allText = techProposals
    .flatMap((p) => [
      p.descripcion,
      (p.datosExtra?.equipamiento as string) ?? "",
      (p.datosExtra?.requerimientosTecnicos as string) ?? "",
    ])
    .join(" ");
  return extractMicrofonosCount(allText);
}

/** Lee campos estructurados Sí/No (+ cantidad) de propuestas TECNICA/PRODUCCION aprobadas */
export function getTecnicaStructured(
  proposals: ApprovedProposal[],
  itemKey: "pantallaLED" | "pantallaRetractil" | "proyector" | "sonido" | "microfonos"
): { found: boolean; text: string } {
  const techProposals = proposals.filter((p) => p.categoria === "TECNICA" || p.categoria === "PRODUCCION");
  const cantidadKey =
    itemKey === "pantallaLED"
      ? "pantallaLEDCantidad"
      : itemKey === "microfonos"
        ? "microfonosCantidad"
        : null;

  const hasSi = techProposals.some(
    (p) => String(p.datosExtra?.[itemKey] ?? "").toLowerCase() === "si"
  );
  const hasNo = techProposals.some(
    (p) => String(p.datosExtra?.[itemKey] ?? "").toLowerCase() === "no"
  );

  if (hasSi) {
    const cantidadVal = cantidadKey
      ? techProposals
          .map((p) => p.datosExtra?.[cantidadKey])
          .find((v) => v != null && String(v).trim() !== "")
      : null;
    const cantidadStr =
      cantidadVal != null && String(cantidadVal).trim() !== ""
        ? ` Cantidad: ${String(cantidadVal).trim()}`
        : "";
    return { found: true, text: `Sí.${cantidadStr}` };
  }
  if (hasNo && !hasSi) {
    return { found: true, text: "No" };
  }
  return { found: false, text: NO_DEFINIDO };
}

/** Catering: tipo (Desayuno / Almuerzo / Cena / Coffee break) */
const CATERING_TIPOS = ["desayuno", "almuerzo", "cena", "coffee break", "break", "refrigerio"];

export function matchCateringTipo(proposals: ApprovedProposal[]): Record<string, boolean> {
  const catProposals = proposals.filter((p) => p.categoria === "CATERING" || p.categoria === "PRODUCCION");
  const result: Record<string, boolean> = {
    desayuno: false,
    almuerzo: false,
    cena: false,
    coffeeBreak: false,
  };
  for (const p of catProposals) {
    const tipo = String(p.datosExtra?.tipoCatering ?? "").toLowerCase().trim();
    if (tipo === "desayuno") result.desayuno = true;
    if (tipo === "almuerzo") result.almuerzo = true;
    if (tipo === "cena") result.cena = true;
    if (tipo === "coffee break" || tipo === "coffee") result.coffeeBreak = true;
  }
  const allText = catProposals
    .flatMap((p) => [
      p.descripcion,
      (p.datosExtra?.restriccionesAlimentarias as string) ?? "",
    ])
    .join(" ")
    .toLowerCase();
  if (allText.includes("desayuno")) result.desayuno = true;
  if (allText.includes("almuerzo")) result.almuerzo = true;
  if (allText.includes("cena")) result.cena = true;
  if (allText.includes("coffee") || allText.includes("break") || allText.includes("refrigerio")) result.coffeeBreak = true;
  return result;
}

export function getCateringRestricciones(proposals: ApprovedProposal[]): string {
  const catProposals = proposals.filter((p) => p.categoria === "CATERING" || p.categoria === "PRODUCCION");
  const rest = catProposals
    .map((p) => (p.datosExtra?.restriccionesAlimentarias as string) ?? "")
    .filter(Boolean)
    .join("; ");
  return resolveValue(rest);
}

export function getCateringCantidad(proposals: ApprovedProposal[]): string {
  const catProposals = proposals.filter((p) => p.categoria === "CATERING" || p.categoria === "PRODUCCION");
  for (const p of catProposals) {
    const n = p.datosExtra?.cateringCantidad ?? p.datosExtra?.cantidadPersonas;
    if (n != null && n !== "") return String(n);
  }
  const descMatch = catProposals
    .map((p) => p.descripcion.match(/(\d+)\s*(personas|pax|asistentes)/i))
    .find(Boolean);
  return descMatch ? descMatch![1]! : POR_CONFIRMAR;
}

/** Cronograma desde AGENDA */
export function buildCronogramaRows(proposals: ApprovedProposal[]): Array<{ horario: string; dinamica: string; orador: string }> {
  const agendaProposals = proposals.filter((p) => p.categoria === "AGENDA");
  if (agendaProposals.length === 0) {
    return [{ horario: POR_CONFIRMAR, dinamica: POR_CONFIRMAR, orador: POR_CONFIRMAR }];
  }
  const rows: Array<{ horario: string; dinamica: string; orador: string }> = [];
  for (const p of agendaProposals) {
    const horario = (p.datosExtra?.horario as string) ?? (p.datosExtra?.fechaEspecifica as string) ?? "";
    const dinamica = p.titulo + (p.descripcion ? ": " + p.descripcion : "");
    rows.push({
      horario: resolveValue(horario, ""),
      dinamica: trimOrNull(dinamica) ?? "",
      orador: POR_CONFIRMAR,
    });
  }
  if (rows.length === 0) {
    return [{ horario: POR_CONFIRMAR, dinamica: POR_CONFIRMAR, orador: POR_CONFIRMAR }];
  }
  return rows;
}

/** Referente: intentar inferir de propuestas OTRO o del event */
export function resolveReferente(event: BriefInput["event"], proposals: ApprovedProposal[]): string {
  if (trimOrNull(event.usuarioSolicitante)) return event.usuarioSolicitante!;
  const otro = proposals.find((p) => p.categoria === "OTRO");
  if (otro?.descripcion?.toLowerCase().includes("referente")) {
    const m = otro.descripcion.match(/referente[:\s]+([^\n.]+)/i);
    if (m) return trimOrNull(m[1]) ?? POR_CONFIRMAR;
  }
  return POR_CONFIRMAR;
}

/** Materiales / Artes gráficas: evidencia en PRODUCCION u OTRO */
export function hasEvidenciaMateriales(proposals: ApprovedProposal[]): boolean {
  const text = proposals
    .flatMap((p) => [p.descripcion, JSON.stringify(p.datosExtra ?? {})])
    .join(" ")
    .toLowerCase();
  return (
    text.includes("material") ||
    text.includes("arte") ||
    text.includes("gráfica") ||
    text.includes("grafica") ||
    text.includes("pieza") ||
    text.includes("banner") ||
    text.includes("folleto")
  );
}

/** Lugar desde LOGISTICA o PRODUCCION */
export function resolveLugar(proposals: ApprovedProposal[]): string {
  for (const p of proposals) {
    if (p.categoria === "LOGISTICA" && p.datosExtra?.lugar) return String(p.datosExtra.lugar);
    if (p.categoria === "PRODUCCION" && p.datosExtra?.lugar) return String(p.datosExtra.lugar);
  }
  return POR_CONFIRMAR;
}

/** Pedido de piezas de comunicación desde propuestas PRODUCCION aprobadas */
export function getComunicacionPiezas(proposals: ApprovedProposal[]): {
  pieza: string;
  medio: string;
  mensajeClave: string;
  restriccionesDiseno: string;
  plazoEntrega: string;
} {
  const prod = proposals.filter((p) => p.categoria === "PRODUCCION");
  const first = (key: string) => {
    const v = prod.map((p) => p.datosExtra?.[key]).find((x) => x != null && String(x).trim() !== "");
    return v != null ? resolveValue(String(v).trim()) : POR_CONFIRMAR;
  };
  return {
    pieza: first("comunicacionPieza"),
    medio: first("comunicacionMedio"),
    mensajeClave: first("comunicacionMensajeClave"),
    restriccionesDiseno: first("comunicacionRestriccionesDiseno"),
    plazoEntrega: first("comunicacionPlazoEntrega"),
  };
}

/** Genera párrafos en prosa narrativa (estilo Brief institucional de referencia) */
export function buildProsaNarrativa(
  event: BriefInput["event"],
  approved: ApprovedProposal[],
  fecha: string,
  publico: string,
  requiere: string
): string[] {
  const titulo = trimOrNull(event.titulo) ?? "Evento";
  const descripcion = trimOrNull(event.descripcion) ?? "";
  const area = trimOrNull(event.areaSolicitante) ?? POR_CONFIRMAR;
  const lugar = resolveLugar(approved);
  const cateringRest = getCateringRestricciones(approved);
  const cateringCant = getCateringCantidad(approved);
  const cateringTipos = matchCateringTipo(approved);
  const tipoCatering = [
    cateringTipos.desayuno && "desayuno",
    cateringTipos.almuerzo && "almuerzo",
    cateringTipos.cena && "cena",
    cateringTipos.coffeeBreak && "coffee break",
  ]
    .filter(Boolean)
    .join(", ");

  const partes: string[] = [];

  // Párrafo 1: descripción, lugar, catering
  let p1 = "";
  if (descripcion) {
    const d = descripcion.trim();
    const dLow = d.toLowerCase();
    if (dLow.startsWith("el evento ") || dLow.startsWith("evento ")) {
      let resto = dLow.startsWith("el ") ? d.slice(3) : d.slice(7);
      resto = resto.replace(/\.+$/, "").trim();
      p1 = `El evento ${resto.charAt(0).toLowerCase() + resto.slice(1)}, denominado "${titulo}", ha sido aprobado`;
    } else {
      p1 = `El evento ${d}, denominado "${titulo}", ha sido aprobado`;
    }
  } else {
    p1 = `El evento denominado "${titulo}" ha sido aprobado`;
  }
  if (approved.length > 0) p1 += " con las definiciones de las áreas correspondientes";
  p1 += ". ";

  if (lugar !== POR_CONFIRMAR) {
    p1 += `Tras la evaluación de las propuestas, se ha determinado que el evento se llevará a cabo en ${lugar}. `;
  } else if (approved.length > 0) {
    p1 += "El lugar de realización queda por confirmar. ";
  }

  // Incluir detalle técnico si hay propuestas TECNICA aprobadas
  const techProposals = approved.filter((p) => p.categoria === "TECNICA");
  if (techProposals.length > 0) {
    const techDetalle = techProposals
      .map((p) => `${p.titulo}: ${p.descripcion}`)
      .join(". ");
    p1 += `En cuanto a lo técnico, ${techDetalle}. `;
  }

  const hayCatering =
    cateringRest !== POR_CONFIRMAR ||
    cateringCant !== POR_CONFIRMAR ||
    tipoCatering;
  if (hayCatering) {
    const detalle: string[] = [];
    if (cateringRest !== POR_CONFIRMAR) {
      detalle.push(`catering ${cateringRest.toLowerCase()}`);
    } else if (tipoCatering) {
      detalle.push(tipoCatering);
    }
    if (cateringCant !== POR_CONFIRMAR) {
      detalle.push(`para ${cateringCant} personas`);
    }
    const textoCatering = detalle.length > 0 ? detalle.join(", ") : "catering";
    p1 += `Se ha aprobado la inclusión de ${textoCatering}, garantizando opciones para todos los asistentes. `;
  }
  if (p1.trim()) partes.push(p1.trim());

  // Párrafo 2: área, público, requerimientos, coordinación
  let p2 = "";
  p2 += `Este evento, solicitado por ${area}, tiene como público objetivo ${publico.toLowerCase()}`;
  if (publico === "Mixto")
    p2 += ", abarcando tanto a funcionarios internos como a ciudadanos externos interesados";
  p2 += ". ";

  if (requiere !== POR_CONFIRMAR) {
    const areas = requiere.split(",").map((s) => s.trim());
    p2 += `La actividad requerirá, según lo aprobado, una planificación exhaustiva en las áreas de ${areas.join(", ")}, asegurando la correcta ejecución del evento`;
    if (lugar !== POR_CONFIRMAR) p2 += ` en el espacio definido`;
    p2 += " y la satisfacción de los asistentes. ";
  }
  p2 +=
    "Se requiere, por tanto, una coordinación detallada para la gestión de la logística, la producción de materiales informativos y la cobertura del evento.";
  partes.push(p2.trim());

  return partes;
}

/** Resumen ejecutivo (2-4 líneas) con hechos confirmados */
export function buildResumenEjecutivo(
  event: BriefInput["event"],
  approved: ApprovedProposal[],
  fecha: string,
  publico: string,
  requiere: string
): string {
  const lugar = resolveLugar(approved);
  const defs = approved.slice(0, 3).map((p) => p.titulo);
  const partes: string[] = [];
  if (event.titulo) partes.push(`"${event.titulo}"`);
  partes.push(`previsto para ${fecha}`);
  if (lugar !== POR_CONFIRMAR) partes.push(`en ${lugar}`);
  partes.push(`público ${publico}`);
  if (requiere !== POR_CONFIRMAR) partes.push(`requiere: ${requiere}`);
  if (defs.length > 0) partes.push(`Definiciones: ${defs.join("; ")}`);
  const faltan = fecha === POR_CONFIRMAR || lugar === POR_CONFIRMAR || approved.length === 0;
  return faltan ? `${partes.join(". ")}. Con detalles operativos por confirmar.` : partes.join(". ");
}

export function hasEvidenciaPedidosEspeciales(proposals: ApprovedProposal[]): boolean {
  const text = proposals
    .flatMap((p) => [p.descripcion, JSON.stringify(p.datosExtra ?? {})])
    .join(" ")
    .toLowerCase();
  return (
    text.includes("pedido especial") ||
    text.includes("especial") ||
    text.includes("particular") ||
    text.includes("específico")
  );
}
