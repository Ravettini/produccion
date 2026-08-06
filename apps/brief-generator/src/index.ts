import { Packer } from "docx";
import { briefInputSchema, type BriefInput } from "./schemas/index.js";
import { buildBriefDocument, buildCompletoBriefDocument } from "./render/index.js";
import { buildAcBriefReducidoDocument } from "./render/acBriefReducido.js";

export type { BriefInput } from "./schemas/index.js";
export { briefInputSchema } from "./schemas/index.js";
export { buildAudiovisualBriefData, buildAudiovisualBriefText } from "./rules/audiovisual.js";

/**
 * Genera un DOCX de Brief audiovisual (modelo: piezas de comunicación y/o cobertura).
 * Solo usa información de propuestas con status APPROVED.
 * Datos faltantes se reemplazan por "Por confirmar".
 */
export async function generateBriefDocx(input: BriefInput): Promise<Buffer> {
  const validated = briefInputSchema.parse(input);
  const doc = buildBriefDocument(validated);
  return Buffer.from(await Packer.toBuffer(doc));
}

/** Brief estratégico completo (todas las áreas / definiciones aprobadas). */
export async function generateCompletoBriefDocx(input: BriefInput): Promise<Buffer> {
  const validated = briefInputSchema.parse(input);
  const doc = buildCompletoBriefDocument(validated);
  return Buffer.from(await Packer.toBuffer(doc));
}

/** Brief reducido para AC (Área de Comunicación) — formato corto operativo. */
export async function generateAcBriefReducidoDocx(input: BriefInput): Promise<Buffer> {
  const validated = briefInputSchema.parse(input);
  const doc = buildAcBriefReducidoDocument(validated);
  return Buffer.from(await Packer.toBuffer(doc));
}
