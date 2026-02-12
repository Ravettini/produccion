import { Packer } from "docx";
import { briefInputSchema, type BriefInput } from "./schemas/index.js";
import { buildBriefDocument } from "./render/index.js";

export type { BriefInput } from "./schemas/index.js";
export { briefInputSchema } from "./schemas/index.js";

/**
 * Genera un DOCX de Brief Estratégico a partir del input validado.
 * Solo usa información de propuestas con status APPROVED.
 * Datos faltantes se reemplazan por "Por confirmar" o "No definido".
 */
export async function generateBriefDocx(input: BriefInput): Promise<Buffer> {
  const validated = briefInputSchema.parse(input);
  const doc = buildBriefDocument(validated);
  return Buffer.from(await Packer.toBuffer(doc));
}
