import { DIRECCIONES_GENERALES_OPTIONS } from "./direccionesGenerales";

/**
 * Listado de áreas para asignación a usuarios y área solicitante.
 */
export const AREAS_OPTIONS: { value: string; label: string }[] = DIRECCIONES_GENERALES_OPTIONS;

/** Áreas extras para roles de especialidad / sistema al crear usuarios. */
export const USER_AREA_OPTIONS: { value: string; label: string }[] = [
  ...AREAS_OPTIONS,
  { value: "Producción", label: "Producción" },
  { value: "Institucionales", label: "Institucionales" },
  { value: "Cobertura", label: "Cobertura" },
  { value: "Sistema", label: "Sistema" },
  { value: "Validador", label: "Validador" },
];
