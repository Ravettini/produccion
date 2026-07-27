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
  // DGMujer – Dirección de la Mujer (GO-007 + GO-008)
  "Dirección de la Mujer": [
    { value: "PARES", label: "PARES", codigo: "GO-008" },
    { value: "Talleres en territorio", label: "Talleres en territorio", codigo: "GO-007" },
    { value: "Padrón de Cuidadores", label: "Padrón de Cuidadores", codigo: "GO-007" },
    { value: "Mujeres en Acción", label: "Mujeres en Acción", codigo: "GO-008" },
    { value: "Expo Empleo/Bolsa de Empleo", label: "Expo Empleo/Bolsa de Empleo", codigo: "GO-008" },
    { value: "Lola Mora", label: "Lola Mora", codigo: "GO-008" },
    { value: "Lactancia", label: "Lactancia", codigo: "GO-007" },
    {
      value: "Plan de Igualdad de Oportunidades Ley 474",
      label: "Plan de Igualdad de Oportunidades Ley 474",
      codigo: "GO-007",
    },
    {
      value: "Presupuesto con Perspectiva de Genero Ley 6170",
      label: "Presupuesto con Perspectiva de Genero Ley 6170",
      codigo: "GO-007",
    },
  ],

  // DGTC – Transformación Cultural (GO-013)
  "Transformación Cultural": [
    {
      value: "Transformaciones en Vivo Vecinos",
      label: "Transformaciones en Vivo Vecinos",
      codigo: "GO-013",
    },
    { value: "Encuentros Vecinos CM", label: "Encuentros Vecinos CM", codigo: "GO-013" },
    { value: "Encuentros FyD", label: "Encuentros FyD", codigo: "GO-013" },
    {
      value: "De la Oficina al Territorio",
      label: "De la Oficina al Territorio",
      codigo: "GO-013",
    },
  ],

  // DGRS – Responsabilidad Social
  "Responsabilidad Social": [
    { value: "Articulaciones", label: "Articulaciones" },
    { value: "Mesas de Acción Colectiva", label: "Mesas de Acción Colectiva" },
  ],

  // DGPJ – Políticas de Juventud (GO-014 + GO-015)
  "Políticas de Juventud": [
    { value: "Hub Joven", label: "Hub Joven", codigo: "GO-015" },
    { value: "Gabinete Joven", label: "Gabinete Joven", codigo: "GO-014" },
    { value: "Proyectate", label: "Proyectate", codigo: "GO-015" },
    { value: "ES x BA Joven", label: "ES x BA Joven", codigo: "GO-015" },
    { value: "Vinculación intragobierno", label: "Vinculación intragobierno", codigo: "GO-014" },
    { value: "AltaVoz", label: "AltaVoz", codigo: "GO-015" },
    { value: "BA Joven", label: "BA Joven" },
  ],

  // DGCSP – Cultura del Servicio Público (GO-010 + GO-011)
  "Cultura del Servicio Público": [
    { value: "Gabinete Ampliado", label: "Gabinete Ampliado", codigo: "GO-011" },
    { value: "Encuentros de SSs y DGs", label: "Encuentros de SSs y DGs", codigo: "GO-011" },
    { value: "Gabinetes Ministeriales", label: "Gabinetes Ministeriales", codigo: "GO-011" },
    { value: "Jornadas Ministeriales", label: "Jornadas Ministeriales", codigo: "GO-011" },
    { value: "Desayunos de cercanía", label: "Desayunos de cercanía", codigo: "GO-011" },
    { value: "Gob Lab", label: "Gob Lab", codigo: "GO-011" },
    { value: "Almuerzos interministeriales", label: "Almuerzos interministeriales", codigo: "GO-011" },
    { value: "BA Desde Adentro", label: "BA Desde Adentro", codigo: "GO-010" },
  ],
};

/** Devuelve los proyectos disponibles para un área (o array vacío si no hay definición). */
export function getProgramasParaArea(areaNombre: string): ProgramaOption[] {
  if (!areaNombre?.trim()) return [];
  return PROGRAMAS_POR_AREA[areaNombre.trim()] ?? [];
}
