import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import jwt from "jsonwebtoken";
import { getEventPendingForUser } from "../../apps/web/src/utils/changeAlerts.ts";

// Base aislada en memoria: estas pruebas no usan .env, PostgreSQL ni correo.
test("API: visibilidad, decisiones históricas, aprobación y lugar informativo", async (t) => {
  process.env.NO_DATABASE = "true";
  process.env.NOTIFY_EMAIL_ENABLED = "false";
  process.env.JWT_SECRET = "event-regression-test";
  await import("express-async-errors");
  const { prisma } = await import("../../apps/api/src/lib/prisma.ts");
  const db = prisma as any;
  const users = [
    { id: "gobc", role: "ORGANIZACION", area: "Relaciones Gubernamentales", name: "GOBC", esSsccyrs: true },
    { id: "inst", role: "INSTITUCIONALES", area: null, name: "Institucionales", esSsccyrs: true },
    { id: "prod", role: "PRODUCCION", area: null, name: "Producción", esSsccyrs: true },
  ];
  const events = new Map<string, any>();
  const decisions: any[] = [];
  const base = {
    titulo: "Actividad", descripcion: "Prueba", tipoEvento: "Institucionales, Producción",
    areaSolicitante: "Relaciones Gubernamentales", estado: "PENDIENTE", createdById: "gobc",
    fechaTentativa: new Date("2026-10-13T12:00:00Z"), createdAt: new Date(), updatedAt: new Date(),
    proposals: [], lugar: null, necesitaAcreditacion: false,
  };
  events.set("legacy", { ...base, id: "legacy" });
  events.set("other", { ...base, id: "other", areaSolicitante: "DG Gestión Animal" });
  events.set("full", { ...base, id: "full", tipoEvento: "Institucionales" });
  for (const eventId of ["legacy", "full"]) {
    decisions.push({ id: `old-${eventId}`, eventId, areaRole: "AGENDA", estado: "APPROVED", updatedAt: new Date("2026-10-01"), user: users[1] });
  }
  db.user.findUnique = async ({ where }: any) => users.find((u) => u.id === where.id) ?? null;
  const enriched = (row: any) => row ? { ...row, areaDecisions: decisions.filter((d) => d.eventId === row.id) } : null;
  db.event.findMany = async () => [...events.values()].map(enriched);
  db.event.findUnique = async ({ where }: any) => enriched(events.get(where.id));
  db.event.create = async ({ data }: any) => {
    const id = `new-${events.size}`;
    const row = { ...base, ...data, id };
    events.set(id, row);
    return enriched(row);
  };
  db.event.update = async ({ where, data }: any) => {
    events.set(where.id, { ...events.get(where.id), ...data });
    return enriched(events.get(where.id));
  };
  db.eventAreaDecision = {
    findMany: async ({ where }: any) => decisions.filter((d) => d.eventId === where.eventId),
    upsert: async ({ where, create, update }: any) => {
      const { eventId, areaRole } = where.eventId_areaRole;
      let row = decisions.find((d) => d.eventId === eventId && d.areaRole === areaRole);
      if (!row) {
        row = { ...create, id: `decision-${decisions.length}`, updatedAt: new Date() };
        decisions.push(row);
      } else if (Object.keys(update).length) {
        Object.assign(row, update, { updatedAt: new Date() });
      }
      return { ...row, user: users.find((u) => u.id === row.userId) ?? row.user ?? null };
    },
  };
  db.eventAudit = { create: async ({ data }: any) => data };
  db.$transaction = async (operation: any) => operation(db);
  const { eventsRouter } = await import("../../apps/api/src/routes/events.ts");
  const { eventDecisionsRouter } = await import("../../apps/api/src/routes/eventDecisions.ts");
  const app = express();
  app.use(express.json());
  app.use("/events", eventDecisionsRouter, eventsRouter);
  app.use((error: Error, _req: any, res: any, _next: any) => res.status(500).json({ error: error.message }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  t.after(() => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const address = server.address() as { port: number };
  const request = async (path: string, userId = "gobc", method = "GET", body?: unknown) => {
    const user = users.find((u) => u.id === userId)!;
    const token = jwt.sign({ userId: user.id, role: user.role, area: user.area }, process.env.JWT_SECRET!);
    const response = await fetch(`http://127.0.0.1:${address.port}/events${path}`, {
      method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() as any };
  };

  await t.test("listado y detalle mantienen el límite por subsecretaría", async () => {
    const list = await request("");
    assert.equal(list.status, 200);
    assert.deepEqual(list.body.map((e: any) => e.id), ["legacy", "full"]);
    assert.equal(list.body[0].estado, "PENDIENTE");
    assert.equal((await request("/other")).status, 403);
    assert.equal((await request("/legacy")).status, 200);
  });

  await t.test("consultar el panel no borra el check AGENDA del listado", async () => {
    const panel = await request("/legacy/area-decisions", "inst");
    assert.equal(panel.status, 200);
    const inst = panel.body.decisions.find((d: any) => d.areaRole === "INSTITUCIONALES");
    assert.equal(inst.estado, "APPROVED");
    assert.equal(inst.user.name, "Institucionales");
    assert.equal(panel.body.decisions.length, 2);
    const list = (await request("")).body;
    const item = list.find((e: any) => e.id === "legacy");
    assert.equal(getEventPendingForUser("INSTITUCIONALES", item).faltaMiAprobacion, false);
    assert.equal(getEventPendingForUser("PRODUCCION", item).faltaMiAprobacion, true);
  });

  await t.test("el estado efectivo coincide antes y después de consultar el detalle", async () => {
    const item = (await request("")).body.find((e: any) => e.id === "full");
    assert.equal(item.estado, "CONFIRMADO");
    assert.equal((await request("/full")).body.estado, item.estado);
    assert.equal((await request("/full/area-decisions")).body.eventEstado, item.estado);
  });

  await t.test("un nuevo check confirma junto con el histórico y elimina la acción pendiente", async () => {
    const result = await request("/legacy/area-decisions", "prod", "POST", { decision: "APPROVED" });
    assert.equal(result.status, 200);
    assert.equal(result.body.eventConfirmed, true);
    const item = (await request("")).body.find((e: any) => e.id === "legacy");
    assert.equal(item.estado, "CONFIRMADO");
    assert.equal(getEventPendingForUser("PRODUCCION", item).requiereAccion, false);
    assert.equal(item.areaChecklist.every((d: any) => d.estado === "APPROVED"), true);
  });

  await t.test("guardar, editar y borrar lugares sin crear aprobaciones informativas", async () => {
    for (const lugar of [undefined, "Sede del catálogo", "Domicilio propio 123"]) {
      const result = await request("", "gobc", "POST", {
        titulo: "Informativo", descripcion: "Prueba de ubicación", tipoEvento: "Solo informar",
        areaSolicitante: base.areaSolicitante, fechaTentativa: "2026-10-13", lugar,
      });
      assert.equal(result.status, 201);
      assert.equal(result.body.lugar, lugar ?? null);
      assert.equal(result.body.estado, "CONFIRMADO");
      const id = result.body.id;
      assert.deepEqual((await request(`/${id}/area-decisions`)).body.requested, []);
      assert.equal((await request(`/${id}`, "gobc", "PUT", { lugar: "Nueva sede" })).body.lugar, "Nueva sede");
      const cleared = await request(`/${id}`, "gobc", "PUT", { lugar: null });
      assert.equal(cleared.status, 200);
      assert.equal(cleared.body.lugar, null);
      assert.equal(cleared.body.estado, "CONFIRMADO");
    }
  });
});
