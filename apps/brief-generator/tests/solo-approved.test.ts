import { describe, it, expect } from "vitest";
import AdmZip from "adm-zip";
import { generateBriefDocx } from "../src/index.js";

function extractDocxText(buffer: Buffer): string {
  const zip = new AdmZip(buffer);
  const entry = zip.getEntry("word/document.xml");
  if (!entry) return "";
  return entry.getData().toString("utf-8");
}

describe("Estructura brief audiovisual", () => {
  it("incluye encabezado del modelo institucional", async () => {
    const input = {
      event: {
        titulo: "Evento Test",
        descripcion: "Sinopsis de prueba",
        requiere: ["Cobertura"],
        areaSolicitante: "Comunicación Interna",
        usuarioSolicitante: "María García",
        publico: "INTERNO",
        fechaTentativa: "2026-06-22",
        estado: "PENDIENTE",
        lugar: "Palacio Lezama",
        datosProduccion: {
          horarioComienzo: "16:00",
          coberturaObjetivo: "Difundir la jornada",
          comunicacionMedio: "Instagram",
        },
      },
      proposals: [],
    };
    const buffer = await generateBriefDocx(input);
    const xml = extractDocxText(buffer);
    expect(xml).toContain("BRIEF");
    expect(xml).toContain("PEDIDO DE PIEZAS DE COMUNICACIÓN");
    expect(xml).toContain("Y/O COBERTURA DE EVENTO");
    expect(xml).toContain("Sinopsis de prueba");
    expect(xml).toContain("Palacio Lezama");
    expect(xml).toContain("22/6/2026");
    expect(xml).toContain("16.00hs");
  });

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
          categoria: "PRODUCCION",
          titulo: "Cobertura aprobada",
          descripcion: "Registro del evento",
          impacto: "MEDIO",
          datosExtra: { coberturaFormato: "Reel vertical" },
        },
      ],
    };
    const buffer = await generateBriefDocx(input);
    const xml = extractDocxText(buffer);
    expect(xml).not.toContain("Streaming 4K rechazado");
    expect(xml).not.toContain("Este dato NO debe aparecer");
    expect(xml).toContain("Reel vertical");
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
