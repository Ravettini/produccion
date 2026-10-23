import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import jwt from "jsonwebtoken";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
  const proposals = new Map<string, any>();
  const attachments = new Map<string, any>();
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
  db.proposal = {
    findUnique: async ({ where }: any) => {
      const row = proposals.get(where.id);
      return row ? { ...row, event: enriched(events.get(row.eventId)) } : null;
    },
    findFirst: async ({ where }: any) => [...proposals.values()].find((p) => p.eventId === where.eventId && p.categoria === where.categoria) ?? null,
    findMany: async ({ where }: any) => [...proposals.values()].filter((p) => p.eventId === where.eventId && (!where.categoria || p.categoria === where.categoria)),
    create: async ({ data }: any) => {
      const row = { ...data, id: `proposal-${proposals.size}` };
      proposals.set(row.id, row);
      return row;
    },
    update: async ({ where, data }: any) => {
      const row = { ...proposals.get(where.id), ...data };
      proposals.set(row.id, row);
      return row;
    },
    updateMany: async () => ({ count: 0 }),
  };
  db.proposalAudit = { create: async ({ data }: any) => data };
  db.proposalComment = { create: async ({ data }: any) => ({ id: "comment", ...data }) };
  db.eventAttachment = {
    create: async ({ data }: any) => {
      const row = { ...data, id: `attachment-${attachments.size}` };
      attachments.set(row.id, row);
      return row;
    },
    findFirst: async ({ where }: any) => attachments.get(where.id) ?? null,
    delete: async ({ where }: any) => attachments.delete(where.id),
  };
  db.$transaction = async (operation: any) => Array.isArray(operation) ? Promise.all(operation) : operation(db);
  const originalCwd = process.cwd();
  const uploadRoot = mkdtempSync(join(tmpdir(), "event-mail-tests-"));
  process.chdir(uploadRoot);
  t.after(() => { process.chdir(originalCwd); rmSync(uploadRoot, { recursive: true, force: true }); });
  const { eventsRouter } = await import("../../apps/api/src/routes/events.ts");
  const { eventDecisionsRouter } = await import("../../apps/api/src/routes/eventDecisions.ts");
  const { proposalsRouter } = await import("../../apps/api/src/routes/proposals.ts");
  const { proposalByIdRouter } = await import("../../apps/api/src/routes/proposalById.ts");
  const { eventAttachmentsRouter } = await import("../../apps/api/src/routes/eventAttachments.ts");
  const app = express();
  app.use(express.json());
  app.use("/events", eventAttachmentsRouter, eventDecisionsRouter, eventsRouter, proposalsRouter);
  app.use("/proposals", proposalByIdRouter);
  app.use((error: Error, _req: any, res: any, _next: any) => res.status(500).json({ error: error.message }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  t.after(() => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const address = server.address() as { port: number };
  const request = async (path: string, userId = "gobc", method = "GET", body?: unknown) => {
    const user = users.find((u) => u.id === userId)!;
    const token = jwt.sign({ userId: user.id, role: user.role, area: user.area }, process.env.JWT_SECRET!);
    const response = await fetch(`http://127.0.0.1:${address.port}${path.startsWith("/proposals/") ? "" : "/events"}${path}`, {
      method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, body: response.status === 204 ? null : await response.json() as any };
  };

  await t.test("listado y detalle mantienen el límite por subsecretaría", async () => {
    const list = await request("");
    assert.equal(list.status, 200);
    assert.deepEqual(list.body.map((e: any) => e.id), ["legacy", "full"]);
    assert.equal(list.body[0].estado, "PENDIENTE");
    assert.equal((await request("/other")).status, 403);
    assert.equal((await request("/legacy")).status, 200);
  });

  await t.test("Institucionales puede crear, abrir y listar su evento de otra subsecretaría", async () => {
    const created = await request("", "inst", "POST", {
      titulo: "Evento cargado por Nacho", descripcion: "Carga para otra área", tipoEvento: "Producción",
      areaSolicitante: "DG Gestión Animal", fechaTentativa: "2026-10-23",
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.createdById, "inst");
    assert.equal((await request(`/${created.body.id}`, "inst")).status, 200);
    assert.equal((await request("", "inst")).body.some((e: any) => e.id === created.body.id), true);
    assert.equal((await request(`/${created.body.id}`, "gobc")).status, 403);
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

  const sent: any[] = [];
  let smtpFailure = false;
  let rejected: string[] = [];
  process.env.NOTIFY_EMAIL_ENABLED = "true";
  process.env.SMTP_HOST = "smtp.example.test";
  process.env.SMTP_USER = "sender@example.test";
  process.env.SMTP_PASS = "test-only-password";
  process.env.NOTIFY_EMAIL_TO = "production@example.test";
  process.env.NOTIFY_EMAIL_INSTITUCIONALES = "institutional@example.test";
  delete process.env.NOTIFY_EMAIL_PRODUCCION;
  const { default: nodemailer } = await import("nodemailer");
  t.mock.method(nodemailer, "createTransport", () => ({
    sendMail: async (mail: any) => {
      if (smtpFailure) throw new Error("SMTP test failure");
      sent.push(mail);
      return { messageId: "test-message", accepted: ["institutional@example.test"], rejected };
    },
  }));
  const settle = () => new Promise<void>((resolve) => setImmediate(resolve));

  await t.test("destinatarios separados, sin copia implícita al remitente", async () => {
    const { resolveNotifyRecipients } = await import("../../apps/api/src/lib/mail.ts");
    assert.deepEqual(resolveNotifyRecipients({ tipoEvento: "Solo informar" }), ["institutional@example.test"]);
    assert.deepEqual(resolveNotifyRecipients({ tipoEvento: "Institucionales" }), ["production@example.test", "institutional@example.test"]);
    process.env.NOTIFY_EMAIL_PRODUCCION = " PRODUCTION@example.test;production@example.test ";
    assert.deepEqual(resolveNotifyRecipients({ tipoEvento: "Producción" }), ["production@example.test", "institutional@example.test"]);
    process.env.NOTIFY_EMAIL_PRODUCCION = "";
    assert.deepEqual(resolveNotifyRecipients({ tipoEvento: "Producción" }), ["institutional@example.test"]);
    delete process.env.NOTIFY_EMAIL_PRODUCCION;
  });

  await t.test("comparación sin falsos cambios en JSON ni pérdida de cambios en texto", async () => {
    const { describeChanges } = await import("../../apps/api/src/lib/notifications.ts");
    assert.deepEqual(describeChanges({ datosProduccion: '{"hora":"10:00","lugar":"Sede"}' }, {
      datosProduccion: '{"lugar":"Sede","hora":"10:00"}',
    }), []);
    assert.equal(describeChanges({ titulo: "" }, { titulo: "null" }).length, 1);
    assert.deepEqual(describeChanges({ lugar: null }, { lugar: "" }), []);
    const { mailErrorMessage } = await import("../../apps/api/src/lib/mail.ts");
    assert.equal(mailErrorMessage(new Error("Fallo con test-only-password")), "Fallo con [redactado]");
  });

  await t.test("editar datos y estado genera un solo correo; lecturas y guardados idénticos no avisan", async () => {
    sent.length = 0;
    const result = await request("/legacy", "gobc", "PUT", { estado: "EN_ANALISIS", descripcion: "<script>alert(1)</script>", fechaTentativa: "2026-10-16", datosProduccion: { horarioComienzo: "10:00" } });
    await settle();
    assert.equal(result.status, 200);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].to, "production@example.test, institutional@example.test");
    assert.match(sent[0].text, /Autor: GOBC/);
    assert.match(sent[0].html, /&lt;script&gt;/);
    assert.ok(!sent[0].html.includes("<script>"));
    await request("/legacy", "gobc", "PUT", { estado: "EN_ANALISIS", descripcion: "<script>alert(1)</script>", fechaTentativa: "2026-10-16", datosProduccion: { horarioComienzo: "10:00" } });
    await request("/legacy");
    await request("/legacy/area-decisions");
    await request("/legacy", "inst", "PUT", { descripcion: "Sin permiso" });
    await settle();
    assert.equal(sent.length, 1);
  });

  await t.test("Solo informar notifica alta y cambio únicamente a Institucionales", async () => {
    sent.length = 0;
    const created = await request("", "gobc", "POST", { titulo: "Informativo mail", descripcion: "Info", tipoEvento: "Solo informar", areaSolicitante: base.areaSolicitante, fechaTentativa: "2026-10-16" });
    await request(`/${created.body.id}`, "gobc", "PUT", { descripcion: "Info actualizada" });
    await settle();
    assert.equal(sent.length, 2);
    assert.ok(sent.every((mail) => mail.to === "institutional@example.test"));
  });

  await t.test("check y confirmación automática se agrupan, repetir el check no envía", async () => {
    sent.length = 0;
    events.set("checkmail", { ...base, id: "checkmail", tipoEvento: "Institucionales" });
    await request("/checkmail/area-decisions", "inst", "POST", { decision: "APPROVED" });
    await settle();
    assert.equal(sent.length, 1);
    assert.match(sent[0].text, /CONFIRMADO/);
    await request("/checkmail/area-decisions", "inst", "POST", { decision: "APPROVED" });
    await settle();
    assert.equal(sent.length, 1);
  });

  await t.test("campos de especialidad avisan una vez y el guardado vacío no avisa", async () => {
    sent.length = 0;
    assert.equal((await request("/legacy/fields", "prod", "PATCH", { fields: { lugar: "Nueva sede" } })).status, 200);
    await settle();
    assert.equal(sent.length, 1);
    assert.equal((await request("/legacy/fields", "prod", "PATCH", { fields: { lugar: "Nueva sede" } })).status, 400);
    await settle();
    assert.equal(sent.length, 1);
  });

  await t.test("requerimientos: creación, edición, envío, aprobación, rechazo, cancelación y comentarios", async () => {
    events.set("propmail", { ...base, id: "propmail" });
    for (const decision of ["approve", "reject", "cancel"]) {
      proposals.clear();
      sent.length = 0;
      const created = await request("/propmail/proposals", "gobc", "POST", { titulo: "Mi requerimiento", descripcion: "Detalle", categoria: "PRODUCCION" });
      assert.equal(created.status, 201);
      const path = `/proposals/${created.body.id}`;
      assert.equal((await request(path, "gobc", "PUT", { descripcion: "Detalle editado" })).status, 200);
      assert.equal((await request(`${path}/comments`, "gobc", "POST", { body: "Comentario <b>" })).status, 201);
      assert.equal((await request(`${path}/submit`, "gobc", "POST")).status, 200);
      assert.equal((await request(`${path}/${decision}`, decision === "cancel" ? "gobc" : "prod", "POST", { decisionReason: "Motivo" })).status, 200);
      await settle();
      assert.equal(sent.length, 5);
      assert.ok(sent.every((mail) => mail.to === "production@example.test, institutional@example.test"));
      assert.equal((await request(`${path}/submit`, "gobc", "POST")).status, 400);
      await settle();
      assert.equal(sent.length, 5);
    }
  });

  await t.test("adjuntos: alta y eliminación generan un aviso cada una", async () => {
    sent.length = 0;
    const data = new FormData();
    data.append("file", new Blob(["%PDF-1.4 test"], { type: "application/pdf" }), "documento.pdf");
    const token = jwt.sign({ userId: "gobc", role: "ORGANIZACION" }, process.env.JWT_SECRET!);
    const uploaded = await fetch(`http://127.0.0.1:${address.port}/events/legacy/attachments`, {
      method: "POST", headers: { Authorization: `Bearer ${token}` }, body: data,
    });
    assert.equal(uploaded.status, 201);
    const file = await uploaded.json() as any;
    assert.equal((await request(`/legacy/attachments/${file.id}`, "gobc", "DELETE")).status, 204);
    await settle();
    assert.equal(sent.length, 2);
    assert.match(sent[0].text, /Adjunto agregado/);
    assert.match(sent[1].text, /Adjunto eliminado/);
  });

  await t.test("fallos y rechazos SMTP se registran sin revertir el guardado", async () => {
    const errors: unknown[][] = [];
    const warnings: unknown[][] = [];
    const errorMock = t.mock.method(console, "error", (...args) => errors.push(args));
    const warnMock = t.mock.method(console, "warn", (...args) => warnings.push(args));
    smtpFailure = true;
    assert.equal((await request("/legacy", "gobc", "PUT", { descripcion: "Guardado aunque SMTP falle" })).status, 200);
    await settle();
    assert.equal(events.get("legacy").descripcion, "Guardado aunque SMTP falle");
    assert.ok(errors.some((args) => String(args).includes("SMTP test failure")));
    smtpFailure = false;
    rejected = ["production@example.test"];
    assert.equal((await request("/legacy", "gobc", "PUT", { descripcion: "Guardado con rechazo parcial" })).status, 200);
    await settle();
    assert.ok(warnings.some((args) => String(args).includes("production@example.test")));
    assert.ok(!JSON.stringify([...errors, ...warnings]).includes("test-only-password"));
    errorMock.mock.restore();
    warnMock.mock.restore();
  });
});
