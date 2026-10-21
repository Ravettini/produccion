import { describe, expect, it } from "vitest";
import AdmZip from "adm-zip";
import { buildAudiovisualBriefData, buildAudiovisualBriefText, generateBriefDocx } from "../src/index.js";
import type { BriefInput } from "../src/schemas/index.js";

const event: BriefInput["event"] = {
  titulo: "Cobertura",
  descripcion: "",
  requiere: ["Cobertura"],
  areaSolicitante: "Producción",
  fechaTentativa: "2026-10-21",
  datosProduccion: { horarioComienzo: "16:30" },
};

describe("Dirección de la locación audiovisual", () => {
  it.each([
    ["Sede - Auditorio | Uspallata 3160, CABA", "Uspallata 3160, CABA"],
    ["Av. Caseros 3250, CABA", "Av. Caseros 3250, CABA"],
  ])("incluye fecha, hora y dirección para %s en texto y DOCX", async (lugar, direccion) => {
    const input = { event: { ...event, lugar }, proposals: [] };
    const data = buildAudiovisualBriefData(input.event, []);
    expect(data.direccion).toBe(direccion);
    const text = buildAudiovisualBriefText(data);
    expect(text).toContain(`Dirección: ${direccion}`);
    expect(text).toContain("Fecha: 21/10/2026");
    expect(text).toContain("Hora: 16.30hs (Hora de inicio)");
    const zip = new AdmZip(await generateBriefDocx(input));
    const xml = zip.readAsText("word/document.xml");
    for (const value of ["Dirección:", direccion, "Fecha:", "21/10/2026", "Hora:", "16.30hs"]) {
      expect(xml).toContain(value);
    }
  });

  it("usa los datos de producción cuando no hay locación en el evento", () => {
    const data = buildAudiovisualBriefData({
      ...event, datosProduccion: { ...event.datosProduccion, lugar: "Sede | Calle 123" },
    }, []);
    expect(data.direccion).toBe("Calle 123");
  });

  it("omite la dirección si no se informó una locación", async () => {
    const data = buildAudiovisualBriefData(event, []);
    expect(buildAudiovisualBriefText(data)).not.toContain("Dirección:");
    const zip = new AdmZip(await generateBriefDocx({ event, proposals: [] }));
    expect(zip.readAsText("word/document.xml")).not.toContain("Dirección:");
  });
});
