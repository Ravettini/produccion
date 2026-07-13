/**
 * API principal - Express + TypeScript
 * Sirve auth, events, proposals y comments.
 */
import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { adminRouter } from "./routes/admin.js";
import { eventsRouter } from "./routes/events.js";
import { eventsAIRouter } from "./routes/eventsAI.js";
import { proposalsRouter } from "./routes/proposals.js";
import { proposalByIdRouter } from "./routes/proposalById.js";
import { eventAttachmentsRouter } from "./routes/eventAttachments.js";
import { isMockMode } from "./lib/prisma.js";
import { mountWebApp, getWebDistPath, spaDocumentNavMiddleware } from "./staticWeb.js";

const app = express();
const PORT = process.env.PORT ?? 4000;

app.set("trust proxy", 1);

const webDist = getWebDistPath();
if (webDist) {
  app.use(spaDocumentNavMiddleware(webDist));
}

// Producción: mismo dominio (Coolify/Cloudflare). Desarrollo: localhost.
app.use(
  cors({
    origin:
      process.env.CORS_ORIGIN ||
      ((origin, cb) => {
        if (!origin) return cb(null, true);
        if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true);
        if (process.env.NODE_ENV === "production") return cb(null, true);
        cb(null, false);
      }),
  })
);
app.use(express.json());

app.use("/auth", authRouter);
app.use("/admin", adminRouter);
app.use("/events", eventsAIRouter);
app.use("/events", eventAttachmentsRouter); // Antes de eventsRouter para que /:id/attachments tenga prioridad
app.use("/events", eventsRouter);
app.use("/events", proposalsRouter);
app.use("/proposals", proposalByIdRouter);

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    mockMode: isMockMode,
    frontend: getWebDistPath(),
    nodeEnv: process.env.NODE_ENV ?? null,
  });
});

const webRoot = mountWebApp(app) ?? webDist;

app.listen(PORT, () => {
  const publicUrl = process.env.PUBLIC_URL || process.env.CLIENT_URL || `http://localhost:${PORT}`;
  console.log(`API escuchando en puerto ${PORT}`);
  if (webRoot) {
    console.log(`[api] App web en ${publicUrl} (frontend: ${webRoot})`);
  }
});
