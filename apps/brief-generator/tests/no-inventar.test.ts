import { describe, it, expect } from "vitest";
import AdmZip from "adm-zip";
import { generateBriefDocx } from "../src/index.js";

function extractDocxText(buffer: Buffer): string {
  const zip = new AdmZip(buffer);
  const entry = zip.getEntry("word/document.xml");
  if (!entry) return "";
  return entry.getData().toString("utf-8");
}

describe("No inventar datos", () => {
  it("debe incluir 'Por confirmar' cuando faltan datos del evento", async () => {
    const input = {
      event: {
        titulo: "Evento Test",
        descripcion: "",
        requiere: [],
        areaSolicitante: "",
        usuarioSolicitante: null,
        publico: null,
        fechaTentativa: null,
        estado: "BORRADOR",
      },
      proposals: [],
    };
    const buffer = await generateBriefDocx(input);
    const xml = extractDocxText(buffer);
    expect(xml).toContain("Por confirmar");
  });

  it("debe incluir 'No definido' en items técnicos sin evidencia", async () => {
    const input = {
      event: {
        titulo: "Evento Sin Técnica",
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
          status: "APPROVED",
          categoria: "CATERING",
          titulo: "Solo catering",
          descripcion: "Coffee break",
          impacto: "BAJO",
          datosExtra: {},
        },
      ],
    };
    const buffer = await generateBriefDocx(input);
    const xml = extractDocxText(buffer);
    expect(xml).toContain("No definido");
  });
});
