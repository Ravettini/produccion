/**
 * Lugares disponibles según cantidad de personas estimada.
 */
export interface LugarOption {
  value: string;
  label: string;
  minPersonas: number;
  maxPersonas: number;
}

export const LUGARES_POR_CAPACIDAD: LugarOption[] = [
  { value: "Sala de reuniones DG (hasta 20)", label: "Sala de reuniones DG (hasta 20)", minPersonas: 1, maxPersonas: 20 },
  { value: "Sala de conferencias (hasta 50)", label: "Sala de conferencias (hasta 50)", minPersonas: 21, maxPersonas: 50 },
  { value: "Auditorio Lezama (hasta 150)", label: "Auditorio Lezama (hasta 150)", minPersonas: 51, maxPersonas: 150 },
  { value: "Centro Cultural Kirchner (hasta 500)", label: "Centro Cultural Kirchner (hasta 500)", minPersonas: 151, maxPersonas: 500 },
  { value: "Espacio exterior / otro (más de 500)", label: "Espacio exterior / otro (más de 500)", minPersonas: 501, maxPersonas: 99999 },
];

export function getLugaresParaCantidad(cantidad: number): LugarOption[] {
  if (!cantidad || Number.isNaN(cantidad) || cantidad < 1) {
    return LUGARES_POR_CAPACIDAD;
  }
  const filtrados = LUGARES_POR_CAPACIDAD.filter(
    (l) => cantidad >= l.minPersonas && cantidad <= l.maxPersonas
  );
  return filtrados.length > 0 ? filtrados : LUGARES_POR_CAPACIDAD;
}
