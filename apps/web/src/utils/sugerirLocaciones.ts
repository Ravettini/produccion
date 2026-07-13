import { LOCACIONES_2026 } from "../config/locaciones2026.data";
import type {
  CriteriosSugerenciaLocacion,
  Locacion2026,
  LocacionSugerida,
} from "../config/locaciones2026.types";

export type { CriteriosSugerenciaLocacion, Locacion2026, LocacionSugerida };

const LIMITE_DEFAULT = 20;

function etiquetaLocacion(loc: Locacion2026): string {
  const cap =
    loc.capacidad != null
      ? `${loc.capacidad} pers.`
      : loc.sinFichaTecnica
        ? "sin ficha"
        : "cap. no informada";
  return `${loc.sede} — ${loc.nombre} (${cap})`;
}

function valueLocacion(loc: Locacion2026): string {
  return `${loc.sede} - ${loc.nombre} | ${loc.ubicacion}`;
}

/** Coincidencia estricta con requisitos marcados como obligatorios */
function cumpleRequisitosObligatorios(loc: Locacion2026, c: CriteriosSugerenciaLocacion): boolean {
  if (c.requiereWifi && !loc.wifi) return false;
  if (c.requiereAccesibilidad && !loc.accesibilidad) return false;
  if (c.requiereTecnica && !loc.tecnica) return false;
  if (c.requiereBackstage && !loc.backstage) return false;
  if (c.requiereMobiliario && !loc.mobiliario) return false;
  // null = no informado en PDF → no excluir, solo advertir
  if (c.requiereEstacionamiento && loc.estacionamiento === false) return false;
  return true;
}

function cumpleCapacidad(loc: Locacion2026, c: CriteriosSugerenciaLocacion): boolean {
  if (c.cantidadPersonas == null || Number.isNaN(c.cantidadPersonas) || c.cantidadPersonas <= 0) {
    return true;
  }
  if (loc.capacidad == null) return true;
  return loc.capacidad >= c.cantidadPersonas;
}

function advertenciasLocacion(loc: Locacion2026, c: CriteriosSugerenciaLocacion): string[] {
  const adv: string[] = [];
  if (loc.sinFichaTecnica) adv.push("Sin ficha técnica en el catálogo");
  if (loc.capacidad == null && !loc.sinFichaTecnica) adv.push("Capacidad no informada en el PDF");
  if (c.cantidadPersonas && loc.capacidad != null && loc.capacidad > c.cantidadPersonas * 3) {
    adv.push("Espacio grande para la cantidad indicada");
  }
  if (c.requiereEstacionamiento && loc.estacionamiento == null) {
    adv.push("Estacionamiento no informado en el PDF");
  }
  if (c.requiereWifi && !loc.wifi) adv.push("No tiene WiFi según el catálogo");
  if (c.requiereTecnica && !loc.tecnica) adv.push("Sin equipamiento técnico");
  if (c.requiereAccesibilidad && !loc.accesibilidad) adv.push("Sin accesibilidad");
  if (loc.restricciones?.length) adv.push(...loc.restricciones);
  if (loc.notas) adv.push(loc.notas);
  return adv;
}

function puntajeLocacion(loc: Locacion2026, c: CriteriosSugerenciaLocacion): number {
  let score = 100;
  if (!cumpleRequisitosObligatorios(loc, c)) score -= 60;
  if (!cumpleCapacidad(loc, c)) score -= 80;
  if (loc.sinFichaTecnica) score -= 15;
  if (loc.capacidad == null) score -= 8;
  if (c.cantidadPersonas && loc.capacidad != null) {
    const diff = loc.capacidad - c.cantidadPersonas;
    if (diff >= 0) score -= Math.min(diff * 0.12, 25);
  }
  if (c.requiereWifi && loc.wifi) score += 8;
  if (c.requiereTecnica && loc.tecnica) score += 6;
  if (c.requiereAccesibilidad && loc.accesibilidad) score += 5;
  if (c.requiereEstacionamiento && loc.estacionamiento === true) score += 5;
  if (c.requiereBackstage && loc.backstage) score += 4;
  if (c.requiereMobiliario && loc.mobiliario) score += 3;
  return score;
}

function toSugerida(loc: Locacion2026, c: CriteriosSugerenciaLocacion): LocacionSugerida {
  return {
    ...loc,
    etiqueta: etiquetaLocacion(loc),
    value: valueLocacion(loc),
    advertencias: advertenciasLocacion(loc, c),
    puntaje: puntajeLocacion(loc, c),
  };
}

/**
 * Sugiere locaciones ordenadas por afinidad.
 * Siempre devuelve hasta `limite` opciones: primero las que cumplen todo, luego alternativas por puntaje.
 */
export function sugerirLocaciones(
  criterios: CriteriosSugerenciaLocacion,
  limite = LIMITE_DEFAULT
): LocacionSugerida[] {
  const conCapacidad = LOCACIONES_2026.filter((loc) => cumpleCapacidad(loc, criterios));
  const base = conCapacidad.length > 0 ? conCapacidad : LOCACIONES_2026;

  const ordenadas = base
    .map((loc) => toSugerida(loc, criterios))
    .sort((a, b) => b.puntaje - a.puntaje);

  const estrictas = ordenadas.filter(
    (loc) => cumpleRequisitosObligatorios(loc, criterios) && cumpleCapacidad(loc, criterios)
  );

  const resultado: LocacionSugerida[] = [];
  const ids = new Set<string>();

  for (const loc of estrictas) {
    if (resultado.length >= limite) break;
    if (!ids.has(loc.id)) {
      ids.add(loc.id);
      resultado.push(loc);
    }
  }

  if (resultado.length < limite) {
    for (const loc of ordenadas) {
      if (resultado.length >= limite) break;
      if (!ids.has(loc.id)) {
        ids.add(loc.id);
        resultado.push(loc);
      }
    }
  }

  return resultado;
}

/** Opciones para SearchableSelect / Select (catálogo completo ordenado por sugerencia) */
export function opcionesLocacionesSugeridas(criterios: CriteriosSugerenciaLocacion) {
  return sugerirLocaciones(criterios, LOCACIONES_2026.length).map((loc) => ({
    value: loc.value,
    label: loc.advertencias.length > 0 ? `${loc.etiqueta} · ${loc.advertencias[0]}` : loc.etiqueta,
    codigo: loc.sede,
  }));
}

/** Deriva criterios técnicos desde campos de producción del formulario */
export function criteriosDesdeProduccion(datos: Record<string, string>): Partial<CriteriosSugerenciaLocacion> {
  const necesitaTecnica = ["pantallaLED", "proyector", "sonido", "microfonos", "pantallaRetractil"].some(
    (k) => datos[k] === "si"
  );
  const wifiTexto = datos.requerimientosTecnicos?.toLowerCase().includes("wifi") ?? false;
  return {
    requiereTecnica: necesitaTecnica || datos.requiereTecnica === "si",
    requiereWifi: datos.requiereWifi === "si" || wifiTexto,
    requiereAccesibilidad: datos.requiereAccesibilidad === "si",
    requiereEstacionamiento: datos.requiereEstacionamiento === "si",
    requiereBackstage: datos.requiereBackstage === "si",
    requiereMobiliario: datos.requiereMobiliario === "si",
  };
}
