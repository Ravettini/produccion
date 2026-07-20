import { describe, it, expect } from "vitest";
import AdmZip from "adm-zip";
import { generateAcBriefReducidoDocx } from "../src/index.js";

function extractDocxText(buffer: Buffer): string {
  const zip = new AdmZip(buffer);
  const entry = zip.getEntry("word/document.xml");
  if (!entry) return "";
  return entry.getData().toString("utf-8");
}

describe("Brief reducido AC", () => {
  it("incluye datos básicos, descripción, dinámica y SI/NO de cobertura/producción", async () => {
    const buffer = await generateAcBriefReducidoDocx({
      event: {
        titulo: "Almuerzo solidario",
        descripcion: "Llegada, gazebo, almuerzo con vecinos y palabras en el escenario.",
        resumen: "Actividad barrial con vecinos y funcionarios.",
        requiere: ["Cobertura", "Producción"],
        areaSolicitante: "Relaciones Gubernamentales",
        usuarioSolicitante: "Natalia Yahia",
        publico: "EXTERNO",
        fechaTentativa: "2026-07-09",
        estado: "PENDIENTE",
        lugar: "Maure y Migueletes",
        funcionario: "JM, Clara Muzzio",
        datosProduccion: {
          horarioComienzo: "12:45",
          horarioFinalizacion: "14:00",
        },
      },
      proposals: [],
    });
    const xml = extractDocxText(buffer);
    expect(xml).toContain("ACTIVIDAD");
    expect(xml).toContain("Datos básicos");
    expect(xml).toContain("Breve descripción del evento");
    expect(xml).toContain("Actividad barrial con vecinos y funcionarios.");
    expect(xml).toContain("Dinámica");
    expect(xml).toContain("Llegada, gazebo");
    expect(xml).toContain("Cobertura:");
    expect(xml).toContain("Producción:");
    expect(xml).toContain("SI");
    expect(xml).toContain("Maure y Migueletes");
    expect(xml).toContain("Arial");
    expect(xml).not.toContain("audiovisual");
    expect(xml).not.toContain("Sinopsis:");
    expect(xml).not.toContain("Productor:");
    expect(xml).not.toContain("Fecha estimada de entrega");
  });

  it("marca NO cuando no requiere cobertura ni producción", async () => {
    const buffer = await generateAcBriefReducidoDocx({
      event: {
        titulo: "Reunión interna",
        descripcion: "Reunión de equipo.",
        requiere: ["Institucionales"],
        areaSolicitante: "Área",
        fechaTentativa: "2026-08-01",
        estado: "PENDIENTE",
      },
      proposals: [],
    });
    const xml = extractDocxText(buffer);
    expect(xml).toContain("Cobertura:");
    expect(xml).toContain("Producción:");
    expect(xml).toContain("NO");
    // Sin sinopsis aparte, no duplica dinámica con la misma descripción
    expect(xml).toContain("Breve descripción del evento");
    expect(xml).not.toContain("Dinámica");
  });
});
