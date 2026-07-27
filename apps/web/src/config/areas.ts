/**
 * Listado de áreas/direcciones para Área solicitante y asignación a usuarios.
 * Sin códigos, solo nombre del área.
 */

export const AREAS_OPTIONS: { value: string; label: string }[] = [
  { value: "Cultura Ciudadana y Responsabilidad Social", label: "Cultura Ciudadana y Responsabilidad Social" },
  { value: "Bienestar Ciudadano", label: "Bienestar Ciudadano" },
  { value: "Cultura del Servicio Público", label: "Cultura del Servicio Público" },
  { value: "Comunicación Interna", label: "Comunicación Interna" },
  { value: "Cultura Organizacional", label: "Cultura Organizacional" },
  { value: "Políticas de Juventud", label: "Políticas de Juventud" },
  { value: "Relaciones Gubernamentales", label: "Relaciones Gubernamentales" },
  { value: "Relaciones con la Comunidad", label: "Relaciones con la Comunidad" },
  { value: "Responsabilidad Social", label: "Responsabilidad Social" },
  { value: "Transformación Cultural", label: "Transformación Cultural" },
  { value: "Cooperación territorial", label: "Cooperación territorial" },
  { value: "Promotores BA", label: "Promotores BA" },
  { value: "Dirección de la Mujer", label: "Dirección de la Mujer" },
  { value: "Autonomía Económica", label: "Autonomía Económica" },
  { value: "Igualdad de Oportunidades", label: "Igualdad de Oportunidades" },
];

/** Áreas extras para roles de especialidad / sistema al crear usuarios. */
export const USER_AREA_OPTIONS: { value: string; label: string }[] = [
  ...AREAS_OPTIONS,
  { value: "Producción", label: "Producción" },
  { value: "Institucionales", label: "Institucionales" },
  { value: "Cobertura", label: "Cobertura" },
  { value: "Sistema", label: "Sistema" },
  { value: "Validador", label: "Validador" },
];
