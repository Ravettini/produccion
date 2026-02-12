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

const app = express();
const PORT = process.env.PORT ?? 4000;

// En desarrollo permite cualquier localhost (5173, 5174, etc.). En producción usar CORS_ORIGIN.
app.use(
  cors({
    origin:
      process.env.CORS_ORIGIN ||
      ((origin, cb) => {
        if (!origin || /^https?:\/\/localhost(:\d+)?$/.test(origin)) cb(null, true);
        else cb(null, false);
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
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
