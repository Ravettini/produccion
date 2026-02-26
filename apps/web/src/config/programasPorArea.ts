/**
 * Proyectos por área (DG). Según el área del usuario se muestran solo los proyectos que le corresponden.
 * Estructura: DG hereda proyectos de sus GOs. Código GO por proyecto donde aplica.
 */

export interface ProgramaOption {
  value: string;
  label: string;
  codigo?: string;
}

/** Proyectos por nombre de área (coincide con AREAS_OPTIONS value). Solo DGs con proyectos. */
export const PROGRAMAS_POR_AREA: Record<string, ProgramaOption[]> = {
  // DG-004 – Cultura del Servicio Público (hereda GO-010 + GO-011)
  "Cultura del Servicio Público": [
    { value: "BA Desde Adentro", label: "BA Desde Adentro", codigo: "GO-010" },
    { value: "Gabinete Ampliado", label: "Gabinete Ampliado", codigo: "GO-011" },
    { value: "Encuentros de SSs y DGs", label: "Encuentros de SSs y DGs", codigo: "GO-011" },
    { value: "Transformaciones en vivo", label: "Transformaciones en vivo", codigo: "GO-011" },
    { value: "Calendario Abierto", label: "Calendario Abierto", codigo: "GO-011" },
    { value: "Gabinetes Ministeriales", label: "Gabinetes Ministeriales", codigo: "GO-011" },
    { value: "Jornadas Ministeriales", label: "Jornadas Ministeriales", codigo: "GO-011" },
    { value: "Desayunos de cercanía", label: "Desayunos de cercanía", codigo: "GO-011" },
    { value: "Gob Lab", label: "Gob Lab", codigo: "GO-011" },
    { value: "Almuerzos interministeriales", label: "Almuerzos interministeriales", codigo: "GO-011" },
  ],

  // DG-006 – Políticas de Juventud (hereda GO-014 + GO-015)
  "Políticas de Juventud": [
    { value: "Gabinete Joven", label: "Gabinete Joven", codigo: "GO-014" },
    { value: "Vinculación intragobierno", label: "Vinculación intragobierno", codigo: "GO-014" },
    { value: "Hub Joven", label: "Hub Joven", codigo: "GO-015" },
    { value: "Proyectate", label: "Proyectate", codigo: "GO-015" },
    { value: "ES x BA Joven", label: "ES x BA Joven", codigo: "GO-015" },
    { value: "AltaVoz", label: "AltaVoz", codigo: "GO-015" },
  ],

  // DG-001 – Responsabilidad Social (sin GO en organigrama)
  "Responsabilidad Social": [
    { value: "Articulaciones", label: "Articulaciones" },
    { value: "Mesas de Acción Colectiva", label: "Mesas de Acción Colectiva" },
  ],

  // DG-002 – Transformación Cultural (hereda GO-013 + GO-006; solo GO-013 tiene proyectos en tabla)
  "Transformación Cultural": [
    { value: "Transformaciones en Vivo Vecinos", label: "Transformaciones en Vivo Vecinos", codigo: "GO-013" },
    { value: "Encuentros Vecinos CM", label: "Encuentros Vecinos CM", codigo: "GO-013" },
    { value: "Encuentros FyD", label: "Encuentros FyD", codigo: "GO-013" },
    { value: "De la Oficina al Territorio", label: "De la Oficina al Territorio", codigo: "GO-013" },
  ],

  // DG-003 – Dirección de la Mujer (hereda GO-007 + GO-008)
  "Dirección de la Mujer": [
    { value: "PARES", label: "PARES", codigo: "GO-008" },
    { value: "Mujeres en Acción", label: "Mujeres en Acción", codigo: "GO-008" },
    { value: "Expo Empleo/Bolsa de Empleo", label: "Expo Empleo/Bolsa de Empleo", codigo: "GO-008" },
    { value: "Lola Mora", label: "Lola Mora", codigo: "GO-008" },
    { value: "Taller Familias en Red", label: "Taller Familias en Red", codigo: "GO-007" },
    { value: "Cuidados en Territorio", label: "Cuidados en Territorio", codigo: "GO-007" },
    { value: "Padrón de Cuidadores", label: "Padrón de Cuidadores", codigo: "GO-007" },
  ],
};

/** Devuelve los proyectos disponibles para un área (o array vacío si no hay definición). */
export function getProgramasParaArea(areaNombre: string): ProgramaOption[] {
  if (!areaNombre?.trim()) return [];
  return PROGRAMAS_POR_AREA[areaNombre.trim()] ?? [];
}
