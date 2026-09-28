/**
 * Áreas del organigrama de Vicejefatura (Decreto 306/26) más las que ya se usaban.
 * La Subsecretaría de Cultura Ciudadana y sus DG solo las ven quienes son SSCCYRS.
 */
export const DIRECCIONES_GENERALES_OPTIONS: { value: string; label: string }[] = [
  { value: "Ss. de Cultura Ciudadana y Responsabilidad Social", label: "Ss. de Cultura Ciudadana y Responsabilidad Social" },
  { value: "DG Responsabilidad Social", label: "DG Responsabilidad Social" },
  { value: "DG Cultura del Servicio Público", label: "DG Cultura del Servicio Público" },
  { value: "DG Transformación Cultural", label: "DG Transformación Cultural" },
  { value: "DG Políticas de Juventud", label: "DG Políticas de Juventud" },
  { value: "DG de la Mujer", label: "DG de la Mujer" },
  { value: "Ss. de Relaciones Institucionales y Comunicación", label: "Ss. de Relaciones Institucionales y Comunicación" },
  { value: "DG de Relaciones Institucionales y Entidades", label: "DG de Relaciones Institucionales y Entidades" },
  { value: "DG Comunicación", label: "DG Comunicación" },
  { value: "Ss. de Ambiente", label: "Ss. de Ambiente" },
  { value: "DG de Política y Estrategia Ambiental", label: "DG de Política y Estrategia Ambiental" },
  { value: "DG Áreas de Conservación y Restauración Ambiental", label: "DG Áreas de Conservación y Restauración Ambiental" },
  { value: "DG Desarrollo Sostenible y Economía Circular", label: "DG Desarrollo Sostenible y Economía Circular" },
  { value: "DG Gestión Animal", label: "DG Gestión Animal" },
  { value: "Agencia de Protección Ambiental", label: "Agencia de Protección Ambiental (APRA)" },
  { value: "UPE Ecoparque Interactivo de la CABA", label: "UPE Ecoparque Interactivo de la CABA" },
  { value: "Comisión para la Plena Participación e Inclusión de las Personas con Discapacidad", label: "COPIDIS" },
  { value: "DG Investigación de Políticas para Personas con Discapacidad", label: "DG Investigación de Políticas para Personas con Discapacidad" },
  { value: "DG Accesibilidad Universal", label: "DG Accesibilidad Universal" },
  { value: "DG Vida Independiente e Inclusión Económica", label: "DG Vida Independiente e Inclusión Económica" },
  { value: "DG Inclusión Digital", label: "DG Inclusión Digital" },
  { value: "DG Formación Laboral para personas con discapacidad", label: "DG Formación Laboral para personas con discapacidad" },
  { value: "DG Técnica, Administrativa y Legal", label: "DG Técnica, Administrativa y Legal" },
  { value: "Cultura Ciudadana y Responsabilidad Social", label: "Cultura Ciudadana y Responsabilidad Social (anterior)" },
  { value: "Cultura del Servicio Público", label: "Cultura del Servicio Público (anterior)" },
  { value: "Políticas de Juventud", label: "Políticas de Juventud (anterior)" },
  { value: "Responsabilidad Social", label: "Responsabilidad Social (anterior)" },
  { value: "Transformación Cultural", label: "Transformación Cultural (anterior)" },
  { value: "Dirección de la Mujer", label: "Dirección de la Mujer (anterior)" },
  { value: "Bienestar Ciudadano", label: "Bienestar Ciudadano" },
  { value: "Comunicación Interna", label: "Comunicación Interna" },
  { value: "Cultura Organizacional", label: "Cultura Organizacional" },
  { value: "Relaciones Gubernamentales", label: "Relaciones Gubernamentales" },
  { value: "Relaciones con la Comunidad", label: "Relaciones con la Comunidad" },
  { value: "Cooperación territorial", label: "Cooperación territorial" },
  { value: "Promotores BA", label: "Promotores BA" },
  { value: "Autonomía Económica", label: "Autonomía Económica" },
  { value: "Igualdad de Oportunidades", label: "Igualdad de Oportunidades" },
  { value: "AREA CENTRAL", label: "AREA CENTRAL" },
];

export function isDireccionGeneral(nombre: string): boolean {
  return DIRECCIONES_GENERALES_OPTIONS.some((d) => d.value === nombre.trim());
}
