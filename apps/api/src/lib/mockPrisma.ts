/**
 * Cliente Prisma simulado con datos en memoria para desarrollo sin base de datos.
 */
import bcrypt from "bcryptjs";

type Where = Record<string, unknown>;

let idCounter = 1;
function nextId(prefix: string): string {
  return `${prefix}-${idCounter++}`;
}

function now(): Date {
  return new Date();
}

function matchesWhere(row: Record<string, unknown>, where?: Where): boolean {
  if (!where) return true;
  for (const [key, value] of Object.entries(where)) {
    if (value && typeof value === "object") {
      const op = value as Record<string, unknown>;
      if ("not" in op) {
        const notVal = op.not;
        if (notVal === null && (row[key] === null || row[key] === undefined)) return false;
        if (notVal != null && row[key] === notVal) return false;
        continue;
      }
      if ("gte" in op || "lte" in op) {
        const rv = row[key];
        const rd = rv instanceof Date ? rv : new Date(String(rv));
        if ("gte" in op && op.gte != null) {
          const g = op.gte instanceof Date ? op.gte : new Date(String(op.gte));
          if (rd.getTime() < g.getTime()) return false;
        }
        if ("lte" in op && op.lte != null) {
          const l = op.lte instanceof Date ? op.lte : new Date(String(op.lte));
          if (rd.getTime() > l.getTime()) return false;
        }
        continue;
      }
    }
    if (row[key] !== value) return false;
  }
  return true;
}

function pickSelect<T extends Record<string, unknown>>(row: T, select?: Record<string, unknown>): Record<string, unknown> {
  if (!select) return { ...row };
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(select)) {
    if (select[key] === true) out[key] = row[key];
  }
  return out;
}

function sortRows<T extends Record<string, unknown>>(rows: T[], orderBy?: Record<string, "asc" | "desc">): T[] {
  if (!orderBy) return rows;
  const [field, dir] = Object.entries(orderBy)[0] ?? [];
  if (!field) return rows;
  return [...rows].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    const cmp =
      av instanceof Date && bv instanceof Date
        ? av.getTime() - bv.getTime()
        : String(av ?? "").localeCompare(String(bv ?? ""));
    return dir === "desc" ? -cmp : cmp;
  });
}

function createModelStore<T extends Record<string, unknown>>(initial: T[] = []) {
  const rows: T[] = [...initial];

  return {
    all: () => rows,
    findOne: (where?: Where) => rows.find((r) => matchesWhere(r, where)),
    findMany: (where?: Where, orderBy?: Record<string, "asc" | "desc">) =>
      sortRows(rows.filter((r) => matchesWhere(r, where)), orderBy),
    create: (data: Partial<T>) => {
      const row = {
        id: nextId("id"),
        createdAt: now(),
        updatedAt: now(),
        ...data,
      } as T;
      rows.push(row);
      return row;
    },
    update: (where: Where, data: Partial<T>) => {
      const idx = rows.findIndex((r) => matchesWhere(r, where));
      if (idx === -1) throw new Error("Record not found");
      rows[idx] = { ...rows[idx], ...data, updatedAt: now() };
      return rows[idx];
    },
    delete: (where: Where) => {
      const idx = rows.findIndex((r) => matchesWhere(r, where));
      if (idx === -1) throw new Error("Record not found");
      rows.splice(idx, 1);
    },
    deleteMany: () => {
      rows.length = 0;
    },
    count: (where?: Where) => rows.filter((r) => matchesWhere(r, where)).length,
    groupBy: (field: string) => {
      const map = new Map<string, number>();
      for (const row of rows) {
        const key = String(row[field] ?? "");
        map.set(key, (map.get(key) ?? 0) + 1);
      }
      return [...map.entries()].map(([value, count]) => ({
        [field]: value,
        _count: { id: count },
      }));
    },
  };
}

export function createMockPrisma() {
  const passwordHash = bcrypt.hashSync("admin123", 10);

  const users = createModelStore([
    {
      id: "user-admin",
      email: "admin@gobierno.gob",
      password: passwordHash,
      name: "Admin Sistema",
      role: "ADMIN",
      area: "Sistema",
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "user-organizacion",
      email: "organizacion@gobierno.gob",
      password: passwordHash,
      name: "Usuario Organización",
      role: "ORGANIZACION",
      area: "Comunicación Interna",
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "user-validador",
      email: "validador@gobierno.gob",
      password: passwordHash,
      name: "Validador General",
      role: "VALIDADOR",
      area: "Validador",
      createdAt: now(),
      updatedAt: now(),
    },
  ]);

  const events = createModelStore([
    {
      id: "event-1",
      titulo: "Jornada de Gobierno Abierto 2025",
      descripcion: "Evento anual de transparencia y participación ciudadana.",
      tipoEvento: "Jornada",
      areaSolicitante: "Subsecretaría de Gestión Pública",
      fechaTentativa: new Date("2025-03-15"),
      estado: "EN_ANALISIS",
      resumen: null,
      usuarioSolicitante: "Usuario Organización",
      publico: "MIXTO",
      lugar: "Centro Cultural Kirchner",
      programa: null,
      funcionario: null,
      necesitaAcreditacion: true,
      linkAcreditacionConvocados: null,
      motivoCancelacion: null,
      realizacionAsistentes: null,
      realizacionImpacto: null,
      realizacionLinkImpacto: null,
      datosProduccion: null,
      createdById: "user-organizacion",
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "event-2",
      titulo: "Encuentro de Innovación Pública",
      descripcion: "Espacio de intercambio entre equipos de innovación del gobierno.",
      tipoEvento: "Encuentro",
      areaSolicitante: "Dirección de Innovación",
      fechaTentativa: new Date("2025-06-20"),
      estado: "BORRADOR",
      resumen: null,
      usuarioSolicitante: null,
      publico: "INTERNO",
      lugar: null,
      programa: null,
      funcionario: null,
      necesitaAcreditacion: false,
      linkAcreditacionConvocados: null,
      motivoCancelacion: null,
      realizacionAsistentes: null,
      realizacionImpacto: null,
      realizacionLinkImpacto: null,
      datosProduccion: null,
      createdById: "user-organizacion",
      createdAt: now(),
      updatedAt: now(),
    },
  ]);

  const proposals = createModelStore([
    {
      id: "proposal-1",
      eventId: "event-1",
      titulo: "Logística y acreditación",
      nombreProyecto: null,
      descripcion: "Control de accesos, credenciales y señalética.",
      categoria: "LOGISTICA",
      impacto: "ALTO",
      estado: "APPROVED",
      createdById: "user-organizacion",
      validatedById: "user-admin",
      decisionReason: null,
      datosExtra: null,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "proposal-2",
      eventId: "event-1",
      titulo: "Producción audiovisual",
      nombreProyecto: null,
      descripcion: "Streaming y grabación del evento principal.",
      categoria: "PRODUCCION",
      impacto: "MEDIO",
      estado: "SUBMITTED",
      createdById: "user-organizacion",
      validatedById: null,
      decisionReason: null,
      datosExtra: null,
      createdAt: now(),
      updatedAt: now(),
    },
  ]);

  const proposalComments = createModelStore<Record<string, unknown>>([]);
  const proposalAudits = createModelStore<Record<string, unknown>>([]);
  const eventAttachments = createModelStore<Record<string, unknown>>([]);
  const configs = createModelStore<{ id: string; key: string; value: string }>([]);

  function userById(id?: string | null) {
    if (!id) return null;
    return users.findOne({ id });
  }

  function enrichProposal(row: Record<string, unknown>, include?: Record<string, unknown>) {
    const out: Record<string, unknown> = { ...row };
    if (include?.createdBy) {
      const u = userById(row.createdById as string);
      out.createdBy = u ? pickSelect(u, (include.createdBy as { select?: Record<string, unknown> }).select) : null;
    }
    if (include?.validatedBy) {
      const u = userById(row.validatedById as string);
      out.validatedBy = u ? pickSelect(u, (include.validatedBy as { select?: Record<string, unknown> }).select) : null;
    }
    if (include?.event) {
      const e = events.findOne({ id: row.eventId as string });
      out.event = e ? pickSelect(e, (include.event as { select?: Record<string, unknown> }).select) : null;
    }
    if (include?.comments) {
      const opts = include.comments as { orderBy?: Record<string, "asc" | "desc">; include?: Record<string, unknown> };
      const list = proposalComments.findMany({ proposalId: row.id }, opts.orderBy);
      out.comments = list.map((c) => {
        const item: Record<string, unknown> = { ...c };
        if (opts.include?.user) {
          const u = userById(c.userId as string);
          item.user = u ? pickSelect(u, (opts.include.user as { select?: Record<string, unknown> }).select) : null;
        }
        return item;
      });
    }
    if (include?.audits) {
      const opts = include.audits as { orderBy?: Record<string, "asc" | "desc">; include?: Record<string, unknown> };
      const list = proposalAudits.findMany({ proposalId: row.id }, opts.orderBy);
      out.audits = list.map((a) => {
        const item: Record<string, unknown> = { ...a };
        if (opts.include?.user) {
          const u = userById(a.userId as string);
          item.user = u ? pickSelect(u, (opts.include.user as { select?: Record<string, unknown> }).select) : null;
        }
        return item;
      });
    }
    return out;
  }

  function enrichEvent(row: Record<string, unknown>, opts?: { include?: Record<string, unknown> }) {
    const out: Record<string, unknown> = { ...row };
    if (opts?.include?._count) {
      const countSelect = (opts.include._count as { select?: Record<string, boolean> }).select;
      const counts: Record<string, number> = {};
      if (countSelect?.proposals) {
        counts.proposals = proposals.count({ eventId: row.id as string });
      }
      out._count = counts;
    }
    if (opts?.include?.proposals) {
      const pOpts = opts.include.proposals as { where?: Where; orderBy?: Record<string, "asc" | "desc"> };
      let list = proposals.findMany({ eventId: row.id as string }, pOpts.orderBy);
      if (pOpts.where) list = list.filter((p) => matchesWhere(p, pOpts.where));
      out.proposals = list;
    }
    return out;
  }

  const client = {
    user: {
      findUnique: async ({ where, select }: { where: Where; select?: Record<string, boolean> }) => {
        const row = users.findOne(where);
        if (!row) return null;
        return select ? pickSelect(row, select) : row;
      },
      findMany: async ({ select, orderBy }: { select?: Record<string, boolean>; orderBy?: Record<string, "asc" | "desc"> } = {}) => {
        const list = users.findMany(undefined, orderBy);
        return select ? list.map((r) => pickSelect(r, select)) : list;
      },
      create: async ({ data }: { data: Record<string, unknown> }) => users.create(data),
      update: async ({ where, data }: { where: Where; data: Record<string, unknown> }) => users.update(where, data),
      delete: async ({ where }: { where: Where }) => {
        users.delete(where);
      },
    },
    event: {
      findMany: async (opts: { orderBy?: Record<string, "asc" | "desc">; include?: Record<string, unknown>; select?: Record<string, unknown> } = {}) => {
        let list = events.findMany(undefined, opts.orderBy);
        if (opts.select) {
          return list.map((r) => {
            const picked = pickSelect(r, opts.select as Record<string, unknown>);
            const sel = opts.select as Record<string, unknown>;
            if (sel.validatedBy && typeof sel.validatedBy === "object") {
              // no-op for events
            }
            return picked;
          });
        }
        return list.map((r) => enrichEvent(r, { include: opts.include }));
      },
      findUnique: async ({ where, include }: { where: Where; include?: Record<string, unknown> }) => {
        const row = events.findOne(where);
        if (!row) return null;
        return enrichEvent(row, { include });
      },
      create: async ({ data }: { data: Record<string, unknown> }) => events.create(data),
      update: async ({ where, data }: { where: Where; data: Record<string, unknown> }) => events.update(where, data),
      delete: async ({ where }: { where: Where }) => {
        const row = events.findOne(where);
        if (row) {
          proposals.all().filter((p) => p.eventId === row.id).forEach((p) => proposals.delete({ id: p.id }));
          eventAttachments.all().filter((a) => a.eventId === row.id).forEach((a) => eventAttachments.delete({ id: a.id as string }));
        }
        events.delete(where);
      },
      deleteMany: async () => {
        proposals.deleteMany();
        eventAttachments.deleteMany();
        events.deleteMany();
      },
      count: async ({ where }: { where?: Where } = {}) => events.count(where),
      groupBy: async ({ by }: { by: string[]; _count?: { id: boolean } }) => events.groupBy(by[0]),
    },
    proposal: {
      findMany: async (opts: { where?: Where; orderBy?: Record<string, "asc" | "desc">; include?: Record<string, unknown>; select?: Record<string, unknown> } = {}) => {
        let list = proposals.findMany(opts.where, opts.orderBy);
        if (opts.select) {
          return list.map((r) => {
            const picked = pickSelect(r, opts.select as Record<string, unknown>);
            const sel = opts.select as Record<string, unknown>;
            if (sel.validatedBy && typeof sel.validatedBy === "object") {
              const u = userById(r.validatedById as string);
              picked.validatedBy = u
                ? pickSelect(u, (sel.validatedBy as { select?: Record<string, unknown> }).select)
                : null;
            }
            return picked;
          });
        }
        return list.map((r) => enrichProposal(r, opts.include));
      },
      findUnique: async ({ where, include }: { where: Where; include?: Record<string, unknown> }) => {
        const row = proposals.findOne(where);
        if (!row) return null;
        return enrichProposal(row, include);
      },
      create: async ({ data, include }: { data: Record<string, unknown>; include?: Record<string, unknown> }) => {
        const row = proposals.create(data);
        return enrichProposal(row, include);
      },
      update: async ({ where, data, include }: { where: Where; data: Record<string, unknown>; include?: Record<string, unknown> }) => {
        const row = proposals.update(where, data);
        return enrichProposal(row, include);
      },
      count: async ({ where }: { where?: Where } = {}) => proposals.count(where),
      groupBy: async ({ by }: { by: string[]; _count?: { id: boolean } }) => proposals.groupBy(by[0]),
    },
    proposalAudit: {
      create: async ({ data }: { data: Record<string, unknown> }) => proposalAudits.create(data),
    },
    proposalComment: {
      findMany: async (opts: { where?: Where; orderBy?: Record<string, "asc" | "desc">; include?: Record<string, unknown> }) => {
        const list = proposalComments.findMany(opts.where, opts.orderBy);
        return list.map((c) => {
          const item: Record<string, unknown> = { ...c };
          if (opts.include?.user) {
            const u = userById(c.userId as string);
            item.user = u ? pickSelect(u, (opts.include.user as { select?: Record<string, unknown> }).select) : null;
          }
          return item;
        });
      },
      create: async ({ data, include }: { data: Record<string, unknown>; include?: Record<string, unknown> }) => {
        const row = proposalComments.create(data);
        const item: Record<string, unknown> = { ...row };
        if (include?.user) {
          const u = userById(row.userId as string);
          item.user = u ? pickSelect(u, (include.user as { select?: Record<string, unknown> }).select) : null;
        }
        return item;
      },
    },
    eventAttachment: {
      findMany: async ({ where, orderBy }: { where?: Where; orderBy?: Record<string, "asc" | "desc"> }) =>
        eventAttachments.findMany(where, orderBy),
      findFirst: async ({ where }: { where: Where }) => eventAttachments.findOne(where) ?? null,
      create: async ({ data }: { data: Record<string, unknown> }) => eventAttachments.create(data),
      delete: async ({ where }: { where: Where }) => eventAttachments.delete(where),
    },
    config: {
      findUnique: async ({ where }: { where: Where }) => configs.findOne(where) ?? null,
      upsert: async ({ where, create, update }: { where: Where; create: Record<string, unknown>; update: Record<string, unknown> }) => {
        const existing = configs.findOne(where);
        if (existing) return configs.update(where, update);
        return configs.create({ ...create, key: where.key as string });
      },
    },
    $transaction: async (ops: Promise<unknown>[]) => Promise.all(ops),
    $connect: async () => {},
    $disconnect: async () => {},
  };

  return client;
}

export type MockPrismaClient = ReturnType<typeof createMockPrisma>;
