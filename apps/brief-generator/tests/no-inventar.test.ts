import { describe, it, expect } from "vitest";
import AdmZip from "adm-zip";
import { generateBriefDocx } from "../src/index.js";

function extractDocxText(buffer: Buffer): string {
  const zip = new AdmZip(buffer);
  const entry = zip.getEntry("word/document.xml");
  if (!entry) return "";
  return entry.getData().toString("utf-8");
}

describe("Brief dinámico (solo contenido respondido)", () => {
  it("omite campos vacíos y no inventa 'Por confirmar'", async () => {
    const input = {
      event: {
        titulo: "Evento Test",
        descripcion: "",
        requiere: [],
        areaSolicitante: "",
        usuarioSolicitante: null,
        publico: null,
        fechaTentativa: null,
        estado: "PENDIENTE",
      },
      proposals: [],
    };
    const buffer = await generateBriefDocx(input);
    const xml = extractDocxText(buffer);
    expect(xml).toContain("BRIEF");
    expect(xml).toContain("Nombre del proyecto:");
    expect(xml).toContain("Evento Test");
    expect(xml).not.toContain("Por confirmar");
    expect(xml).not.toContain("Sinopsis del proyecto:");
    expect(xml).not.toContain("¿Qué querés comunicar?");
    expect(xml).toContain("Arial");
  });

  it("no muestra preguntas de cobertura sin respuesta", async () => {
    const input = {
      event: {
        titulo: "Evento Sin Cobertura",
        descripcion: "Desc",
        requiere: [],
        areaSolicitante: "Área",
        usuarioSolicitante: "User",
        publico: "INTERNO" as const,
        fechaTentativa: "2025-01-15",
        estado: "PENDIENTE",
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
    expect(xml).not.toContain("¿Qué querés comunicar?");
    expect(xml).not.toContain("¿Por qué canal va a salir?");
    expect(xml).toContain("Fecha:");
    expect(xml).toContain("Arial");
  });

  it("usa el resumen IA como sinopsis (no la descripción)", async () => {
    const input = {
      event: {
        titulo: "Evento",
        descripcion: "Descripción larga del formulario",
        resumen: "Resumen generado por IA",
        requiere: [],
        areaSolicitante: "Área",
        fechaTentativa: "2026-06-22",
        estado: "PENDIENTE",
      },
      proposals: [],
    };
    const buffer = await generateBriefDocx(input);
    const xml = extractDocxText(buffer);
    expect(xml).toContain("Sinopsis del proyecto:");
    expect(xml).toContain("Resumen generado por IA");
    expect(xml).not.toContain("Descripción larga del formulario");
  });
});
