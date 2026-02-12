/**
 * Script para cargar eventos desde un JSON unificado.
 * Uso: npx tsx scripts/cargar-unificado.ts [ruta-al-archivo.json]
 */
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

interface EventoJson {
  titulo?: string;
  descripcion?: string;
  tipoEvento?: string;
  areaSolicitante?: string;
  fechaTentativa?: string;
  estado?: string;
  resumen?: string;
}

const validStatuses = ["BORRADOR", "EN_ANALISIS", "CONFIRMADO", "CANCELADO"];

function normalizeArea(a: unknown): string {
  const s = String(a ?? "").trim();
  if (!s || s.toLowerCase() === "nan" || s === "null") return "Sin área";
  return s;
}

async function main() {
  const filePath = process.argv[2] ?? path.join(process.cwd(), "..", "..", "unificado_sample_10_event_payloads.json");
  const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(absPath)) {
    console.error("Archivo no encontrado:", absPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(absPath, "utf-8");
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch (e) {
    console.error("JSON inválido:", (e as Error).message);
    process.exit(1);
  }

  const eventos = Array.isArray(payload) ? payload : (payload as { eventos?: unknown[] }).eventos ?? [];
  if (eventos.length === 0) {
    console.error("No se encontraron eventos en el archivo");
    process.exit(1);
  }

  let creados = 0;
  let errores = 0;

  for (let i = 0; i < eventos.length; i++) {
    const e = eventos[i] as EventoJson;
    const titulo = String(e?.titulo ?? "").trim();
    const descripcion = String(e?.descripcion ?? "").trim();
    const tipoEvento = String(e?.tipoEvento ?? "INSTITUCIONAL").trim();
    const areaSolicitante = normalizeArea(e?.areaSolicitante);
    const fechaStr = e?.fechaTentativa;

    if (!titulo || !descripcion || !fechaStr) {
      console.error(`[${i + 1}] Faltan titulo, descripcion o fechaTentativa`);
      errores++;
      continue;
    }

    let fechaTentativa: Date;
    try {
      fechaTentativa = new Date(fechaStr);
      if (isNaN(fechaTentativa.getTime())) throw new Error("Fecha inválida");
    } catch {
      console.error(`[${i + 1}] fechaTentativa inválida:`, fechaStr);
      errores++;
      continue;
    }

    const estado = validStatuses.includes(String(e?.estado ?? "")) ? String(e.estado) : "BORRADOR";
    const resumen = e?.resumen != null && String(e.resumen).trim() !== "" ? String(e.resumen) : null;

    try {
      await prisma.event.create({
        data: {
          titulo,
          descripcion,
          tipoEvento,
          areaSolicitante,
          fechaTentativa,
          estado,
          resumen,
          usuarioSolicitante: null,
          publico: null,
        },
      });
      creados++;
      console.log(`[${i + 1}] Creado: ${titulo}`);
    } catch (err) {
      console.error(`[${i + 1}] Error:`, (err as Error).message);
      errores++;
    }
  }

  console.log("\n--- Resumen ---");
  console.log(`Creados: ${creados}`);
  console.log(`Errores: ${errores}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
