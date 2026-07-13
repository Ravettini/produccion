import express, { type Express, type Request, type Response, type NextFunction } from "express";
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_PREFIXES = ["/auth", "/admin", "/events", "/proposals", "/health"];

function isApiPath(reqPath: string): boolean {
  return API_PREFIXES.some((p) => reqPath === p || reqPath.startsWith(`${p}/`));
}

function resolveWebDist(): string | null {
  const fromEnv = process.env.WEB_DIST_PATH?.trim();
  const candidates = [
    fromEnv ? path.resolve(fromEnv) : null,
    path.resolve(__dirname, "../../web/dist"),
    path.resolve(process.cwd(), "../web/dist"),
    path.resolve(process.cwd(), "apps/web/dist"),
  ].filter((p): p is string => Boolean(p));

  for (const dir of candidates) {
    if (existsSync(path.join(dir, "index.html"))) return dir;
  }
  return null;
}

function getDevClientUrl(): string {
  return (process.env.CLIENT_URL || process.env.VITE_DEV_URL || "http://localhost:5173").replace(/\/$/, "");
}

function mountDevRedirect(app: Express): void {
  const clientUrl = getDevClientUrl();
  console.log(`[api] Sin build del frontend. La app está en ${clientUrl} (Vite).`);

  app.get("/", (_req, res) => {
    res.redirect(302, clientUrl);
  });

  app.get("*", (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (isApiPath(req.path)) return next();
    const target = `${clientUrl}${req.path === "/" ? "" : req.path}`;
    res.redirect(302, target);
  });
}

function mountProductionMissingFrontend(app: Express): void {
  console.warn(
    "[api] Producción sin apps/web/dist. Ejecutá npm run build en la raíz o definí WEB_DIST_PATH."
  );

  app.get("/", (_req, res) => {
    res.status(503).json({
      error: "Frontend no compilado",
      hint: 'En el servidor ejecutá "npm run build" o verificá que el Dockerfile incluya apps/web/dist.',
      api: {
        health: "/health",
        auth: "/auth/login",
        events: "/events",
      },
    });
  });
}

/** Sirve el build de Vite (SPA) desde el mismo proceso que la API (deploy en un solo puerto). */
export function mountWebApp(app: Express): string | null {
  const webDist = resolveWebDist();

  if (!webDist) {
    if (process.env.NODE_ENV !== "production") {
      mountDevRedirect(app);
    } else {
      mountProductionMissingFrontend(app);
    }
    return null;
  }

  const indexHtml = path.join(webDist, "index.html");
  app.use(express.static(webDist));

  app.get("*", (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (isApiPath(req.path)) return next();
    res.sendFile(indexHtml, (err) => {
      if (err) next(err);
    });
  });

  console.log(`[api] Frontend estático desde: ${webDist}`);
  return webDist;
}
