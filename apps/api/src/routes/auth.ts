import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireRoles } from "../middleware/auth.js";

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET ?? "secret";
const JWT_EXP = "7d";

/**
 * POST /auth/login
 * Body: { email, password }
 * Devuelve: { token, user: { id, email, name, role } }
 */
authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: "email y password requeridos" });
    return;
  }
  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
  if (!user || !(await bcrypt.compare(String(password), user.password))) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXP }
  );
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, area: user.area ?? null },
  });
});

/**
 * POST /auth/register
 * Solo ADMIN o seed. Body: { email, password, name, role }
 */
authRouter.post("/register", authMiddleware, requireRoles("ADMIN"), async (req, res) => {
  const { email, password, name, role, area } = req.body ?? {};
  if (!email || !password || !name || !role) {
    res.status(400).json({ error: "email, password, name y role requeridos" });
    return;
  }
  const validRoles = ["ADMIN", "DIRECTOR_GENERAL", "ORGANIZACION", "PRODUCCION", "AGENDA", "VALIDADOR"];
  if (!validRoles.includes(String(role))) {
    res.status(400).json({ error: "role inválido" });
    return;
  }
  const existing = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
  if (existing) {
    res.status(409).json({ error: "Ya existe un usuario con ese email" });
    return;
  }
  const hashed = await bcrypt.hash(String(password), 10);
  const user = await prisma.user.create({
    data: {
      email: String(email).toLowerCase(),
      password: hashed,
      name: String(name),
      role,
      area: area !== undefined && String(area).trim() !== "" ? String(area).trim() : null,
    },
  });
  res.status(201).json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role, area: user.area },
  });
});

/**
 * GET /auth/me - Usuario actual (requiere token).
 */
authRouter.get("/me", authMiddleware, async (req, res) => {
  const u = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, email: true, name: true, role: true, area: true },
  });
  if (!u) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }
  res.json(u);
});
