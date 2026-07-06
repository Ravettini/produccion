import { buildAudiovisualBriefData, buildAudiovisualBriefText } from "brief-generator";

type DatosProduccion = Record<string, string> | string | null | undefined;

function parseDatosProduccion(dp: DatosProduccion): Record<string, unknown> {
  if (dp == null) return {};
  if (typeof dp === "string") {
    try {
      const parsed = JSON.parse(dp) as Record<string, unknown>;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  return Object.fromEntries(Object.entries(dp).map(([k, v]) => [k, v != null ? String(v) : ""]));
}

export function buildAutoBriefResumen(input: {
  titulo: string;
  descripcion: string;
  tipoEvento: string;
  areaSolicitante: string;
  fechaTentativa: Date | string;
  publico?: string | null;
  lugar?: string | null;
  programa?: string | null;
  funcionario?: string | null;
  usuarioSolicitante?: string | null;
  datosProduccion?: DatosProduccion;
}): string {
  const dp = parseDatosProduccion(input.datosProduccion);
  const fecha =
    input.fechaTentativa instanceof Date
      ? input.fechaTentativa.toISOString().slice(0, 10)
      : String(input.fechaTentativa).slice(0, 10);

  const data = buildAudiovisualBriefData(
    {
      titulo: input.titulo,
      descripcion: input.descripcion,
      requiere: input.tipoEvento.split(",").map((s) => s.trim()).filter(Boolean),
      areaSolicitante: input.areaSolicitante,
      usuarioSolicitante: input.usuarioSolicitante ?? null,
      publico:
        input.publico === "EXTERNO" || input.publico === "INTERNO" || input.publico === "MIXTO"
          ? input.publico
          : null,
      fechaTentativa: fecha,
      estado: "PENDIENTE",
      lugar: input.lugar ?? null,
      programa: input.programa ?? null,
      funcionario: input.funcionario ?? null,
      datosProduccion: dp,
    },
    []
  );

  return buildAudiovisualBriefText(data);
}
