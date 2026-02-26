/**
 * Rutas para adjuntos PDF de eventos.
 * GET/POST /events/:eventId/attachments
 * GET/DELETE /events/:eventId/attachments/:attachmentId
 */
import { Router } from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";

export const eventAttachmentsRouter = Router({ mergeParams: true });

const UPLOADS_DIR = path.join(process.cwd(), "uploads", "events");
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

function ensureUploadDir(eventId: string) {
  const dir = path.join(UPLOADS_DIR, eventId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const eventId = req.params.eventId;
    if (!eventId) {
      cb(new Error("eventId requerido"), "");
      return;
    }
    const dir = ensureUploadDir(eventId);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const safeName = `${Date.now()}-${Buffer.from(file.originalname, "latin1").toString("utf8").replace(/[/\\:*?"<>|]/g, "_")}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos PDF"));
    }
  },
});

eventAttachmentsRouter.use(authMiddleware);

/**
 * GET /events/:eventId/attachments - Listar adjuntos del evento.
 */
eventAttachmentsRouter.get("/:eventId/attachments", async (req, res) => {
  const { eventId } = req.params;
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    res.status(404).json({ error: "Evento no encontrado" });
    return;
  }
  const attachments = await prisma.eventAttachment.findMany({
    where: { eventId },
    orderBy: { createdAt: "desc" },
  });
  res.json(attachments);
});

/**
 * POST /events/:eventId/attachments - Subir PDF.
 */
eventAttachmentsRouter.post("/:eventId/attachments", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ error: "El archivo supera el límite de 10 MB" });
        return;
      }
    }
    if (err instanceof Error) {
      res.status(400).json({ error: err.message });
      return;
    }
    next();
  });
}, async (req, res) => {
  const { eventId } = req.params;
  const file = req.file as Express.Multer.File | undefined;
  if (!file) {
    res.status(400).json({ error: "No se envió ningún archivo. Usá el campo 'file'." });
    return;
  }
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    fs.unlink(file.path, () => {});
    res.status(404).json({ error: "Evento no encontrado" });
    return;
  }
  const tipo = req.body?.tipo === "impacto" ? "impacto" : "documento";
  const attachment = await prisma.eventAttachment.create({
    data: {
      eventId,
      originalName: file.originalname,
      storedPath: path.relative(path.join(UPLOADS_DIR, eventId), file.path),
      mimeType: file.mimetype,
      size: file.size,
      tipo,
    },
  });
  res.status(201).json(attachment);
});

/**
 * GET /events/:eventId/attachments/:attachmentId/download - Descargar PDF.
 */
eventAttachmentsRouter.get("/:eventId/attachments/:attachmentId/download", async (req, res) => {
  const { eventId, attachmentId } = req.params;
  const attachment = await prisma.eventAttachment.findFirst({
    where: { id: attachmentId, eventId },
  });
  if (!attachment) {
    res.status(404).json({ error: "Archivo no encontrado" });
    return;
  }
  const filePath = path.join(UPLOADS_DIR, eventId, attachment.storedPath);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "Archivo no encontrado en disco" });
    return;
  }
  res.setHeader("Content-Type", attachment.mimeType);
  res.setHeader("Content-Disposition", `attachment; filename="${attachment.originalName.replace(/"/g, '\\"')}"`);
  res.sendFile(path.resolve(filePath));
});

/**
 * DELETE /events/:eventId/attachments/:attachmentId - Eliminar adjunto.
 */
eventAttachmentsRouter.delete("/:eventId/attachments/:attachmentId", async (req, res) => {
  const { eventId, attachmentId } = req.params;
  const attachment = await prisma.eventAttachment.findFirst({
    where: { id: attachmentId, eventId },
  });
  if (!attachment) {
    res.status(404).json({ error: "Archivo no encontrado" });
    return;
  }
  const filePath = path.join(UPLOADS_DIR, eventId, attachment.storedPath);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  await prisma.eventAttachment.delete({
    where: { id: attachmentId },
  });
  res.status(204).send();
});
