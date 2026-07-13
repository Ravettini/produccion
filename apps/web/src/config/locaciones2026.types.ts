export interface Locacion2026 {
  id: string;
  sede: string;
  nombre: string;
  ubicacion: string;
  capacidad: number | null;
  accesibilidad: boolean;
  tecnica: boolean;
  tecnicaDetalle?: string;
  mobiliario: boolean;
  backstage: boolean;
  estacionamiento: boolean | null;
  wifi: boolean;
  escenario?: boolean;
  notas?: string;
  restricciones?: string[];
  contacto?: string;
  sinFichaTecnica?: boolean;
}

export interface CriteriosSugerenciaLocacion {
  cantidadPersonas?: number;
  requiereWifi?: boolean;
  requiereAccesibilidad?: boolean;
  requiereTecnica?: boolean;
  requiereEstacionamiento?: boolean;
  requiereBackstage?: boolean;
  requiereMobiliario?: boolean;
}

export interface LocacionSugerida extends Locacion2026 {
  etiqueta: string;
  value: string;
  advertencias: string[];
  puntaje: number;
}
