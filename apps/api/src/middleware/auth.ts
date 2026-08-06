import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  area?: string | null;
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
    return;
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
 * Roles que pueden aprobar/rechazar propuestas (la categoría se valida en el handler).
 */
export const canValidate = requireRoles(
  "ADMIN",
  "VALIDADOR",
  "PRODUCCION",
  "INSTITUCIONALES",
  "AGENDA",
  "COBERTURA"
);

/**
 * Puede crear requerimientos: organización, producción, institucionales/agenda, cobertura y admin.
 */
export const canCreateProposal = requireRoles(
  "ORGANIZACION",
  "PRODUCCION",
  "AGENDA",
  "INSTITUCIONALES",
  "COBERTURA",
  "ADMIN"
);

/** Categorías que cada rol puede validar. */
export function rolesAllowedForProposalCategory(
  role: string,
  categoria: string,
  titulo?: string | null
): boolean {
  if (role === "ADMIN" || role === "VALIDADOR") return true;
  if (role === "PRODUCCION") {
    return ["PRODUCCION", "CATERING", "TECNICA", "LOGISTICA"].includes(categoria);
  }
  if (role === "INSTITUCIONALES" || role === "AGENDA") {
    return categoria === "AGENDA";
  }
  if (role === "COBERTURA") {
    return (
      categoria === "OTRO" &&
      String(titulo ?? "")
        .toLowerCase()
        .includes("cobertura")
    );
  }
  return false;
}
