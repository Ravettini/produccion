import express, { type Express, type Request, type Response, type NextFunction } from "express";
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_PREFIXES = ["/auth", "/admin", "/events", "/proposals", "/health"];

function resolveWebDist(): string | null {
  const fromEnv = process.env.WEB_DIST_PATH?.trim();
  if (fromEnv) {
    const p = path.resolve(fromEnv);
    if (existsSync(path.join(p, "index.html"))) return p;
  }
  const candidates = [
    path.resolve(__dirname, "../../web/dist"),
    path.resolve(process.cwd(), "apps/web/dist"),
    path.resolve(process.cwd(), "../web/dist"),
  ];
  for (const dir of candidates) {
    if (existsSync(path.join(dir, "index.html"))) return dir;
  }
  return null;
}

/** Sirve el build de Vite (SPA) desde el mismo proceso que la API (deploy en un solo puerto). */
export function mountWebApp(app: Express): string | null {
  const webDist = resolveWebDist();
  if (!webDist) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[api] No hay apps/web/dist/index.html. Ejecutá npm run build en la raíz o definí WEB_DIST_PATH."
      );
    }
    return null;
  }

  const indexHtml = path.join(webDist, "index.html");
  app.use(express.static(webDist));

  app.get("*", (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (API_PREFIXES.some((p) => req.path === p || req.path.startsWith(`${p}/`))) {
      return next();
    }
    res.sendFile(indexHtml, (err) => {
      if (err) next(err);
    });
  });

  console.log(`[api] Frontend estático desde: ${webDist}`);
  return webDist;
}
