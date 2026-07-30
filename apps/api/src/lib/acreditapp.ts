/**
 * Cliente HTTP para crear eventos en Acreditapp (API externa).
 * Vars: ACREDITAPP_API_BASE, ACREDITAPP_API_KEY, ACREDITAPP_PUBLIC_URL
 */
const TIMEOUT_MS = 12_000;

export type AcreditappConfig = {
  apiBase: string;
  apiKey: string;
  publicUrl: string;
};

export type CreateAcreditappEventOpts = {
  description?: string;
  location?: string;
  startAt?: string;
  endAt?: string;
  enableMesas?: boolean;
  mesaCount?: number | null;
  enableNotes?: boolean;
  enableGoogleSheets?: boolean;
};

export type CreateAcreditappEventResult = {
  id: string;
  name: string;
  url: string;
};

export class AcreditappError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "AcreditappError";
  }
}

export function getAcreditappConfig(): AcreditappConfig {
  const apiBase = process.env.ACREDITAPP_API_BASE?.trim().replace(/\/$/, "");
  const apiKey = process.env.ACREDITAPP_API_KEY?.trim();
  const publicUrl = process.env.ACREDITAPP_PUBLIC_URL?.trim().replace(/\/$/, "");

  if (!apiBase || !apiKey || !publicUrl) {
    throw new AcreditappError(
      "Acreditapp no configurada. Definí ACREDITAPP_API_BASE, ACREDITAPP_API_KEY y ACREDITAPP_PUBLIC_URL en apps/api/.env"
    );
  }

  return { apiBase, apiKey, publicUrl };
}

/** Acreditapp exige name con al menos 3 caracteres. */
export function normalizeAcreditappName(raw: string): string {
  const name = raw.trim();
  if (name.length >= 3) return name;
  if (name.length === 0) return "Evento";
  return `${name} — Evento`.slice(0, 200);
}

function parseDatosProduccion(raw: unknown): Record<string, string> {
  if (raw == null) return {};
  if (typeof raw === "object" && !Array.isArray(raw)) {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (v != null && String(v).trim() !== "") out[k] = String(v);
    }
    return out;
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      return parseDatosProduccion(JSON.parse(raw));
    } catch {
      return {};
    }
  }
  return {};
}

/** Lee flags de acreditación guardados en datosProduccion del evento. */
export function acreditappOptsFromDatos(datosProduccion?: unknown): Pick<
  CreateAcreditappEventOpts,
  "enableMesas" | "mesaCount" | "enableNotes" | "enableGoogleSheets"
> {
  const dp = parseDatosProduccion(datosProduccion);
  const enableMesas = dp.acreditacionMesas === "si";
  const rawCount = parseInt(dp.acreditacionMesaCount ?? "", 10);
  const mesaCount =
    enableMesas && Number.isFinite(rawCount) && rawCount >= 1 ? rawCount : enableMesas ? 1 : null;
  return {
    enableMesas,
    mesaCount,
    enableNotes: dp.acreditacionNotas === "si",
    enableGoogleSheets: dp.acreditacionSheets === "si",
  };
}

export async function createAcreditappEvent(
  name: string,
  opts: CreateAcreditappEventOpts = {}
): Promise<CreateAcreditappEventResult> {
  const { apiBase, apiKey, publicUrl } = getAcreditappConfig();
  const safeName = normalizeAcreditappName(name);

  const enableMesas = opts.enableMesas === true;
  const body: Record<string, unknown> = {
    name: safeName,
    kind: "gcba",
    status: "draft",
    enableMesas,
    enableNotes: opts.enableNotes === true,
    enableGoogleSheets: opts.enableGoogleSheets === true,
  };
  if (enableMesas) {
    body.mesaCount =
      opts.mesaCount != null && Number(opts.mesaCount) >= 1 ? Number(opts.mesaCount) : 1;
  } else {
    body.mesaCount = null;
  }
  if (opts.description?.trim()) body.description = opts.description.trim();
  if (opts.location?.trim()) body.location = opts.location.trim();
  if (opts.startAt) body.startAt = opts.startAt;
  if (opts.endAt) body.endAt = opts.endAt;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${apiBase}/api/v1/external/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      data = {};
    }

    if (!res.ok) {
      const detail =
        typeof data.error === "string"
          ? data.error
          : typeof data.message === "string"
            ? data.message
            : `HTTP ${res.status}`;
      console.error("[acreditapp] create event failed:", res.status, detail);
      throw new AcreditappError(
        `No se pudo crear el evento en Acreditapp (${detail})`,
        res.status
      );
    }

    const id = typeof data.id === "string" ? data.id : null;
    if (!id) {
      console.error("[acreditapp] create event: respuesta sin id");
      throw new AcreditappError("Acreditapp no devolvió id del evento");
    }

    const returnedName = typeof data.name === "string" ? data.name : safeName;
    return {
      id,
      name: returnedName,
      url: `${publicUrl}/events/${id}?tab=terminal`,
    };
  } catch (err) {
    if (err instanceof AcreditappError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      console.error("[acreditapp] create event timed out");
      throw new AcreditappError("Timeout al contactar Acreditapp");
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[acreditapp] create event error:", msg);
    throw new AcreditappError(`Error de red al contactar Acreditapp: ${msg}`);
  } finally {
    clearTimeout(timer);
  }
}

type EventLike = {
  id: string;
  titulo: string;
  descripcion?: string | null;
  lugar?: string | null;
  fechaTentativa?: Date | string | null;
  necesitaAcreditacion?: boolean | null;
  linkAcreditacionConvocados?: string | null;
  datosProduccion?: unknown;
};

/**
 * Si el evento necesita acreditación y aún no tiene link, crea el evento remoto y
 * devuelve el link (o un warning si falla). No lanza: el CRUD local no debe romperse.
 */
export async function ensureAcreditappLink(
  event: EventLike
): Promise<{ link?: string; warning?: string }> {
  if (event.necesitaAcreditacion !== true) {
    return {};
  }
  const existing = event.linkAcreditacionConvocados?.trim();
  if (existing) {
    return { link: existing };
  }

  try {
    let startAt: string | undefined;
    let endAt: string | undefined;
    if (event.fechaTentativa) {
      // El día se manda al mediodía para que ninguna zona horaria lo corra.
      const raw =
        event.fechaTentativa instanceof Date
          ? event.fechaTentativa.toISOString()
          : String(event.fechaTentativa);
      const dia = raw.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
      const start = dia ? new Date(`${dia}T12:00:00.000Z`) : new Date(raw);
      if (!Number.isNaN(start.getTime())) {
        startAt = start.toISOString();
        endAt = new Date(start.getTime() + 8 * 60 * 60 * 1000).toISOString();
      }
    }

    const flags = acreditappOptsFromDatos(event.datosProduccion);
    const created = await createAcreditappEvent(event.titulo, {
      description: event.descripcion ?? undefined,
      location: event.lugar ?? undefined,
      startAt,
      endAt,
      ...flags,
    });
    return { link: created.url };
  } catch (err) {
    const warning =
      err instanceof AcreditappError
        ? err.message
        : "El evento se guardó, pero no se pudo crear en Acreditapp. Revisá la configuración o reintentá.";
    console.error("[acreditapp] ensureAcreditappLink:", warning);
    return { warning };
  }
}
