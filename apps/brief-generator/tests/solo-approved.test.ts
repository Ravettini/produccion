import { describe, it, expect } from "vitest";
import AdmZip from "adm-zip";
import { generateBriefDocx } from "../src/index.js";

function extractDocxText(buffer: Buffer): string {
  const zip = new AdmZip(buffer);
  const entry = zip.getEntry("word/document.xml");
  if (!entry) return "";
  return entry.getData().toString("utf-8");
}

describe("Solo propuestas APPROVED", () => {
  it("no debe incluir información de propuestas REJECTED", async () => {
    const input = {
      event: {
        titulo: "Evento Test",
        descripcion: "Desc",
        requiere: [],
        areaSolicitante: "Área",
        usuarioSolicitante: "User",
        publico: "INTERNO",
        fechaTentativa: "2025-01-15",
        estado: "BORRADOR",
      },
      proposals: [
        {
          status: "REJECTED",
          categoria: "TECNICA",
          titulo: "Streaming 4K rechazado",
          descripcion: "Este dato NO debe aparecer en el brief",
          impacto: "ALTO",
          datosExtra: { equipamientoNecesario: "Streaming 4K" },
        },
        {
          status: "APPROVED",
          categoria: "TECNICA",
          titulo: "Proyector aprobado",
          descripcion: "Proyector estándar",
          impacto: "MEDIO",
          datosExtra: {},
        },
      ],
    };
    const buffer = await generateBriefDocx(input);
    const xml = extractDocxText(buffer);
    expect(xml).not.toContain("Streaming 4K rechazado");
    expect(xml).not.toContain("Este dato NO debe aparecer");
    expect(xml).toContain("Proyector");
  });

  it("no debe incluir propuestas PENDING", async () => {
    const input = {
      event: {
        titulo: "Evento",
        descripcion: "D",
        requiere: [],
        areaSolicitante: "A",
        usuarioSolicitante: "U",
        publico: "INTERNO",
        fechaTentativa: null,
        estado: "BORRADOR",
      },
      proposals: [
        {
          status: "PENDING",
          categoria: "CATERING",
          titulo: "Almuerzo pendiente",
          descripcion: "No debe aparecer",
          impacto: "BAJO",
          datosExtra: {},
        },
      ],
    };
    const buffer = await generateBriefDocx(input);
    const xml = extractDocxText(buffer);
    expect(xml).not.toContain("Almuerzo pendiente");
    expect(xml).not.toContain("No debe aparecer");
  });
});
