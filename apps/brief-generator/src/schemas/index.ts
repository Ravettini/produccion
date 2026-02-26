import { z } from "zod";

const datosExtraProducion = z.object({
  horarioCitacion: z.string().optional().nullable(),
  lugar: z.string().optional().nullable(),
  cantidadPersonas: z.union([z.string(), z.number()]).optional().nullable(),
  equipamiento: z.string().optional().nullable(),
  equipamientoNecesario: z.string().optional().nullable(),
  // Técnica (Producción incluye técnica)
  pantallaLED: z.string().optional().nullable(),
  pantallaLEDCantidad: z.union([z.string(), z.number()]).optional().nullable(),
  pantallaRetractil: z.string().optional().nullable(),
  proyector: z.string().optional().nullable(),
  sonido: z.string().optional().nullable(),
  microfonos: z.string().optional().nullable(),
  microfonosCantidad: z.union([z.string(), z.number()]).optional().nullable(),
  requerimientosTecnicos: z.string().optional().nullable(),
  // Catering (Producción incluye catering)
  tipoCatering: z.string().optional().nullable(),
  cateringCantidad: z.union([z.string(), z.number()]).optional().nullable(),
  restriccionesAlimentarias: z.string().optional().nullable(),
  comunicacionPieza: z.string().optional().nullable(),
  comunicacionMedio: z.string().optional().nullable(),
  comunicacionMensajeClave: z.string().optional().nullable(),
  comunicacionRestriccionesDiseno: z.string().optional().nullable(),
  comunicacionPlazoEntrega: z.string().optional().nullable(),
}).passthrough();

const datosExtraAgenda = z.object({
  horario: z.string().optional().nullable(),
  fechaEspecifica: z.string().optional().nullable(),
  duracionEstimada: z.string().optional().nullable(),
}).passthrough();

const datosExtraLogistica = z.object({
  lugar: z.string().optional().nullable(),
  horarioMontaje: z.string().optional().nullable(),
}).passthrough();

const datosExtraCatering = z.object({
  cantidadPersonas: z.union([z.string(), z.number()]).optional().nullable(),
  restriccionesAlimentarias: z.string().optional().nullable(),
}).passthrough();

const datosExtraTecnica = z.object({
  equipamiento: z.string().optional().nullable(),
  equipamientoNecesario: z.string().optional().nullable(),
  requerimientosTecnicos: z.string().optional().nullable(),
  pantallaLED: z.string().optional().nullable(),
  pantallaLEDCantidad: z.union([z.string(), z.number()]).optional().nullable(),
  pantallaRetractil: z.string().optional().nullable(),
  proyector: z.string().optional().nullable(),
  sonido: z.string().optional().nullable(),
  microfonos: z.string().optional().nullable(),
  microfonosCantidad: z.union([z.string(), z.number()]).optional().nullable(),
}).passthrough();

const datosExtraSchema = z.union([
  datosExtraProducion,
  datosExtraAgenda,
  datosExtraLogistica,
  datosExtraCatering,
  datosExtraTecnica,
  z.record(z.unknown()),
]);

export const proposalSchema = z.object({
  status: z.string(),
  categoria: z.string(),
  titulo: z.string(),
  nombreProyecto: z.string().optional().nullable(),
  descripcion: z.string(),
  impacto: z.string(),
  datosExtra: z.union([datosExtraSchema, z.record(z.unknown())]).optional().nullable(),
});

export const eventSchema = z.object({
  titulo: z.string(),
  descripcion: z.string(),
  requiere: z.union([z.array(z.string()), z.string()]).transform((v) =>
    Array.isArray(v) ? v : (typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : [])
  ),
  areaSolicitante: z.string(),
  usuarioSolicitante: z.string().optional().nullable(),
  publico: z.enum(["EXTERNO", "INTERNO", "MIXTO"]).optional().nullable(),
  fechaTentativa: z.string().nullable().optional(),
  estado: z.string().optional(),
  lugar: z.string().optional().nullable(),
  programa: z.string().optional().nullable(),
  funcionario: z.string().optional().nullable(),
  datosProduccion: z.record(z.unknown()).optional().nullable(),
});

export const briefInputSchema = z.object({
  event: eventSchema,
  proposals: z.array(proposalSchema),
});

export type BriefInput = z.infer<typeof briefInputSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type ProposalInput = z.infer<typeof proposalSchema>;
