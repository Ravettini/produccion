import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Download, ImageDown, Printer } from "lucide-react";
import { toJpeg } from "html-to-image";
import { listEvents } from "../api/events";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import { parseDatosProduccion } from "../utils/eventHelpers";
import { toCivilDateString } from "../utils/formatters";
import type { Event } from "../types";
import { cn } from "../utils/cn";

const DAY_LABELS = ["LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO", "DOMINGO"];

const MES_CORTO = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
];

/** Abreviaciones típicas de DG para la agenda impresa. */
const DG_ABBR: Record<string, string> = {
  "Cultura Ciudadana y Responsabilidad Social": "DGRS",
  "Bienestar Ciudadano": "DBC",
  "Cultura del Servicio Público": "DCSP",
  "Comunicación Interna": "CI",
  "Cultura Organizacional": "DCO",
  "Políticas de Juventud": "DPJ",
  "Relaciones Gubernamentales": "GOBC",
  "Relaciones con la Comunidad": "DRC",
  "Responsabilidad Social": "DRS",
  "Transformación Cultural": "DTC",
  "Cooperación territorial": "DCT",
  "Promotores BA": "PBA",
  "Dirección de la Mujer": "DGM",
  "Autonomía Económica": "DAE",
  "Igualdad de Oportunidades": "DIO",
  Institucionales: "CENTRAL",
  Sistema: "CENTRAL",
};

function mondayOfWeek(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(12, 0, 0, 0);
  const day = copy.getDay(); // 0=dom
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function civilFromLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatHoraAgenda(event: Event): string {
  const dp = parseDatosProduccion(event.datosProduccion);
  const raw = (dp.horarioComienzo || dp.horarioConvocatoria || "").trim();
  if (!raw) return "";
  // Normalizar "16:30" / "16.30" / "9hs" → "16.30hs" / "9hs"
  const m = raw.match(/(\d{1,2})[:.](\d{2})/);
  if (m) return `${Number(m[1])}.${m[2]}hs`;
  const h = raw.match(/(\d{1,2})\s*hs?/i);
  if (h) return `${Number(h[1])}hs`;
  return raw;
}

function abbrDg(area: string): string {
  if (DG_ABBR[area]) return DG_ABBR[area];
  const words = area.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "DG";
  if (words.length === 1) return words[0]!.slice(0, 4).toUpperCase();
  return words
    .filter((w) => !/^(de|del|la|las|los|y|con)$/i.test(w))
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 5);
}

function canSeeAgenda(role?: string | null): boolean {
  return ["ADMIN", "INSTITUCIONALES", "AGENDA"].includes(role ?? "");
}

export default function AgendaInstitucionales() {
  const { user } = useAuth();
  const [weekAnchor, setWeekAnchor] = useState(() => mondayOfWeek(new Date()));
  const [exportingJpg, setExportingJpg] = useState(false);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: listEvents,
  });

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekAnchor, i));
  }, [weekAnchor]);

  const byDay = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const day of weekDays) map.set(civilFromLocalDate(day), []);
    for (const ev of events) {
      if (ev.estado === "CANCELADO") continue;
      // Institucionales ve toda la agenda (incluyendo eventos que no les pidieron soporte).
      const civil = toCivilDateString(ev.fechaTentativa);
      if (!map.has(civil)) continue;
      map.get(civil)!.push(ev);
    }
    for (const list of map.values()) {
      list.sort((a, b) => formatHoraAgenda(a).localeCompare(formatHoraAgenda(b), "es"));
    }
    return map;
  }, [events, weekDays]);

  const mesLabel = MES_CORTO[weekAnchor.getMonth()] ?? "";
  const year = weekAnchor.getFullYear();
  const sidebarTitle = `AGENDA SSCCYRS - ${mesLabel} ${year}`;

  const handleDownloadJpg = async () => {
    const node = document.getElementById("agenda-ssccyrs-print");
    if (!node) return;
    setExportingJpg(true);
    try {
      // Doble pasada: la primera calienta fuentes/estilos y mejora fidelidad de color.
      await toJpeg(node, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });
      const dataUrl = await toJpeg(node, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
        style: {
          overflow: "visible",
          printColorAdjust: "exact",
          WebkitPrintColorAdjust: "exact",
        } as Partial<CSSStyleDeclaration>,
      });
      const from = civilFromLocalDate(weekDays[0]!);
      const to = civilFromLocalDate(weekDays[6]!);
      const link = document.createElement("a");
      link.download = `Agenda-SSCCYRS-${from}_${to}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error(error);
      alert("No se pudo generar la imagen JPG.");
    } finally {
      setExportingJpg(false);
    }
  };

  if (!canSeeAgenda(user?.role)) {
    return (
      <div className="page-container">
        <PageHeader title="Agenda semanal" subtitle="Solo disponible para Institucionales y Admin" />
      </div>
    );
  }

  return (
    <div className="page-container max-w-[1400px]">
      <PageHeader
        title="Agenda semanal SSCCYRS"
        subtitle="Vista semanal de todos los eventos. Descarga en JPG a color o PDF."
        actions={
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setWeekAnchor((w) => addDays(w, -7))}
            >
              <ChevronLeft className="w-4 h-4" aria-hidden />
              Semana anterior
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setWeekAnchor(mondayOfWeek(new Date()))}
            >
              Esta semana
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setWeekAnchor((w) => addDays(w, 7))}
            >
              Semana siguiente
              <ChevronRight className="w-4 h-4" aria-hidden />
            </Button>
            <Button
              size="sm"
              onClick={() => void handleDownloadJpg()}
              disabled={exportingJpg || isLoading}
            >
              <ImageDown className="w-4 h-4" aria-hidden />
              {exportingJpg ? "Generando JPG…" : "Descargar JPG"}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => window.print()}>
              <Download className="w-4 h-4" aria-hidden />
              PDF
            </Button>
            <Button size="sm" variant="secondary" onClick={() => window.print()}>
              <Printer className="w-4 h-4" aria-hidden />
              Imprimir
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <p className="text-slate-500">Cargando eventos…</p>
      ) : (
        <div
          id="agenda-ssccyrs-print"
          className={cn(
            "bg-white border border-slate-200 shadow-sm overflow-hidden",
            "print:shadow-none print:border-0"
          )}
          style={{
            // Fuerza fondos de color en captura e impresión
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          }}
        >
          <div className="flex min-h-[520px]">
            {/* Sidebar vertical */}
            <div className="w-14 sm:w-16 shrink-0 bg-[#7BA8B0] text-white flex flex-col items-center py-4 relative print:w-14">
              <img
                src="/ba-desde-adentro.png"
                alt="BA Desde adentro"
                className="w-10 h-auto object-contain"
                draggable={false}
              />
              <p className="mt-1 text-[8px] text-center leading-tight px-1 opacity-90">
                Desde
                <br />
                adentro
              </p>
              <div className="flex-1 flex items-center justify-center">
                <p
                  className="whitespace-nowrap text-xs sm:text-sm font-semibold tracking-wide"
                  style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                >
                  {sidebarTitle}
                </p>
              </div>
            </div>

            {/* Columnas */}
            <div className="flex-1 grid grid-cols-7 min-w-0">
              {weekDays.map((day, i) => {
                const civil = civilFromLocalDate(day);
                const dayEvents = byDay.get(civil) ?? [];
                return (
                  <div
                    key={civil}
                    className={cn(
                      "border-l border-slate-200 min-h-[480px] flex flex-col",
                      i === 0 && "border-l-0"
                    )}
                  >
                    <div className="relative px-1.5 pt-2 pb-1 border-b border-slate-100">
                      <p className="text-[10px] sm:text-xs font-bold uppercase text-slate-900 tracking-wide text-center">
                        {DAY_LABELS[i]}
                      </p>
                      <span className="absolute top-1.5 right-1.5 text-[10px] text-slate-400 tabular-nums">
                        {day.getDate()}
                      </span>
                    </div>
                    <ul className="flex-1 p-1.5 space-y-1.5 overflow-hidden">
                      {dayEvents.map((ev) => {
                        const highlight = ev.estado === "CONFIRMADO";
                        return (
                          <li
                            key={ev.id}
                            className={cn(
                              "text-[10px] sm:text-[11px] leading-snug text-slate-800 px-1 py-0.5 rounded-sm",
                              highlight && "bg-amber-300"
                            )}
                          >
                            <span className="font-bold">{formatHoraAgenda(ev) || "-"}</span>
                            {formatHoraAgenda(ev) ? ": " : " "}
                            <span className="font-bold">{abbrDg(ev.areaSolicitante)}</span>
                            {" - "}
                            <span>{ev.titulo}</span>
                            {ev.lugar?.trim() ? (
                              <span className="text-slate-600"> ({ev.lugar.trim()})</span>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end items-center gap-2 px-4 py-3 border-t border-slate-100">
            <div className="w-12 h-12 rounded-full bg-[#7BA8B0] flex items-center justify-center p-1.5">
              <img
                src="/ba-desde-adentro.png"
                alt="BA Desde adentro"
                className="w-full h-auto object-contain"
                draggable={false}
              />
            </div>
            <span className="text-[10px] text-slate-500 max-w-[4.5rem] leading-tight">
              Desde adentro
            </span>
          </div>
        </div>
      )}

      <p className="mt-3 text-xs text-slate-400 print:hidden">
        Tip: «Descargar JPG» genera la agenda a color. «PDF» abre el diálogo de impresión (elegí
        «Guardar como PDF» y activá «Gráficos de fondo» si hace falta). Los confirmados van en
        amarillo.
      </p>

      <style>{`
        @media print {
          @page { size: landscape; margin: 8mm; }
          html, body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body * { visibility: hidden !important; }
          #agenda-ssccyrs-print, #agenda-ssccyrs-print * { visibility: visible !important; }
          #agenda-ssccyrs-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          #agenda-ssccyrs-print .bg-\\[\\#7BA8B0\\],
          #agenda-ssccyrs-print .bg-amber-300 {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
