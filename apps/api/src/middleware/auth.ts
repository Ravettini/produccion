import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { id: string };
    }
  }
}

/**
 * Middleware: verifica JWT y carga user en req.user.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token requerido" });
    return;
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? "secret") as JwtPayload;
    req.user = { ...payload, id: payload.userId };
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
}

/**
 * Opcional: solo si hay token, lo valida y pone user.
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next();
    return;
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? "secret") as JwtPayload;
    req.user = { ...payload, id: payload.userId };
  } catch {
    // Ignorar token inválido y seguir sin user
  }
  next();
}

/**
 * Requiere que req.user tenga uno de los roles indicados.
 */
export function requireRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Sin permisos para esta acción" });
      return;
    }
    next();
  };
}

/**
 * Puede aprobar/rechazar propuestas: solo ADMIN (confirmar = solo admins).
 */
export const canValidate = requireRoles("ADMIN");

/**
 * Puede crear propuestas: ORGANIZACION, PRODUCCION, AGENDA (y ADMIN).
 */
export const canCreateProposal = requireRoles("ORGANIZACION", "PRODUCCION", "AGENDA", "ADMIN");
