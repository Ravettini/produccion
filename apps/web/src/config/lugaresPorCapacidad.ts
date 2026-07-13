/**
 * @deprecated Usar `opcionesLocacionesSugeridas` desde `utils/sugerirLocaciones`.
 */
import { opcionesLocacionesSugeridas } from "../utils/sugerirLocaciones";

export interface LugarOption {
  value: string;
  label: string;
  minPersonas: number;
  maxPersonas: number;
}

export function getLugaresParaCantidad(cantidad: number): LugarOption[] {
  const opts = opcionesLocacionesSugeridas({
    cantidadPersonas: cantidad > 0 ? cantidad : undefined,
  });
  return opts.map((o) => ({
    value: o.value,
    label: o.label,
    minPersonas: 0,
    maxPersonas: 99999,
  }));
}
