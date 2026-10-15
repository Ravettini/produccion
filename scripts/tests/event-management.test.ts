import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildAreaChecklist, normalizeAreaDecisions, effectiveEventStatus } from "../../apps/api/src/lib/areaDecisions.ts";
import { canUserSeeEvent } from "../../apps/api/src/lib/eventVisibility.ts";
import { buildWizardSteps } from "../../apps/web/src/config/eventFormWizardSteps.ts";
import { canSeeAllCalendarStatuses } from "../../apps/web/src/hooks/usePermissions.ts";
import { getEventPendingForUser } from "../../apps/web/src/utils/changeAlerts.ts";
import { EventFormWizardContent, type EventFormWizardContentProps } from "../../apps/web/src/pages/EventFormWizardContent.tsx";
import { formatCreatedDate } from "../../apps/web/src/utils/formatters.ts";
import { eventMatchesTipoFilter } from "../../apps/web/src/utils/eventHelpers.ts";

test("la fecha de carga usa Buenos Aires incluso cerca de medianoche UTC", () => {
  assert.equal(formatCreatedDate("2026-10-15T02:59:59Z"), "14/10/2026");
  assert.equal(formatCreatedDate("2026-10-15T03:00:00Z"), "15/10/2026");
  assert.equal(formatCreatedDate("invalid"), "—");
});

test("las pestañas incluyen eventos con múltiples requerimientos y tipos históricos", () => {
  assert.equal(eventMatchesTipoFilter("Producción, Institucionales, Cobertura", "produccion"), true);
  assert.equal(eventMatchesTipoFilter("Producción, Institucionales, Cobertura", "institucionales"), true);
  assert.equal(eventMatchesTipoFilter("Comunicación", "cobertura"), true);
  assert.equal(eventMatchesTipoFilter("Solo informar", "solo-informar"), true);
  assert.equal(eventMatchesTipoFilter("Producción", "solo-informar"), false);
  assert.equal(eventMatchesTipoFilter("Otro personalizado", ""), true);
});

const event = { tipoEvento: "Institucionales, Producción", areaSolicitante: "Relaciones Gubernamentales", estado: "PENDIENTE" };
const legacy = { areaRole: "AGENDA", estado: "APPROVED", updatedAt: "2026-10-01T12:00:00Z", user: { id: "a", name: "Institucionales" } };
const pending = { areaRole: "INSTITUCIONALES", estado: "PENDING", updatedAt: "2026-10-02T12:00:00Z" };

test("GOBC ve pendientes de su subsecretaría en ambas vistas, sin acceder a otras", () => {
  for (const role of ["ORGANIZACION", "DIRECTOR_GENERAL"] as const) {
    const user = { id: "gobc", role, area: "Relaciones Gubernamentales", name: "GOBC", email: "gobc@example.test" };
    assert.equal(canSeeAllCalendarStatuses(user), true);
    assert.equal(canUserSeeEvent(user, event), true);
    assert.equal(canUserSeeEvent(user, { ...event, areaSolicitante: "Políticas de Juventud" }), true);
    assert.equal(canUserSeeEvent(user, { ...event, areaSolicitante: "DG Gestión Animal" }), false);
  }
});

test("una fila pendiente nueva no reemplaza el check histórico de AGENDA", () => {
  for (const rows of [[legacy, pending], [pending, legacy]]) {
    const checklist = buildAreaChecklist(event.tipoEvento, rows, event.areaSolicitante);
    const inst = checklist.find((item) => item.areaRole === "INSTITUCIONALES")!;
    assert.equal(inst.estado, "APPROVED");
    assert.equal(inst.decidedBy, "Institucionales");
    assert.equal(getEventPendingForUser("INSTITUCIONALES", { areaChecklist: checklist }).faltaMiAprobacion, false);
    assert.equal(getEventPendingForUser("AGENDA", { areaChecklist: checklist }).requiereAccion, false);
    assert.equal(getEventPendingForUser("PRODUCCION", { areaChecklist: checklist }).faltaMiAprobacion, true);
  }
});

test("entre decisiones explícitas gana la más reciente, incluyendo rechazos", () => {
  const rejection = { ...pending, estado: "REJECTED" };
  for (const rows of [[legacy, rejection], [rejection, legacy]]) {
    assert.equal(normalizeAreaDecisions(rows)[0].estado, "REJECTED");
    assert.equal(effectiveEventStatus({ ...event, tipoEvento: "Institucionales" }, rows), "PENDIENTE");
  }
  const laterLegacy = { ...legacy, updatedAt: "2026-10-03T12:00:00Z" };
  assert.equal(normalizeAreaDecisions([rejection, laterLegacy])[0].estado, "APPROVED");
  assert.equal(normalizeAreaDecisions([legacy, { ...legacy, areaRole: "INSTITUCIONALES", estado: "REJECTED" }])[0].estado, "REJECTED");
});

test("confirmación requiere todos los checks y conserva estados finales", () => {
  const rows = [legacy, pending, { areaRole: "PRODUCCION", estado: "APPROVED" }];
  assert.equal(effectiveEventStatus(event, [legacy]), "PENDIENTE");
  assert.equal(effectiveEventStatus(event, rows), "CONFIRMADO");
  for (const estado of ["CANCELADO", "REALIZADO", "CONFIRMADO"]) {
    assert.equal(effectiveEventStatus({ ...event, estado }, rows), estado);
  }
  assert.deepEqual(buildAreaChecklist("Solo informar", rows, event.areaSolicitante), []);
});

test("aprobar requerimientos no equivale a aprobar el área", () => {
  const areaChecklist = buildAreaChecklist(event.tipoEvento, [], event.areaSolicitante);
  const proposals = [{ id: "p", categoria: "AGENDA", estado: "APPROVED", updatedAt: "2026-10-01" }];
  assert.equal(getEventPendingForUser("INSTITUCIONALES", { areaChecklist, proposals }).faltaMiAprobacion, true);
});

test("Solo informar incluye Lugar en alta y edición sin pedir servicios", () => {
  for (const isEdit of [false, true]) {
    const steps = buildWizardSteps({ tipoSeleccionados: ["Solo informar"], isEdit, estado: "CONFIRMADO" });
    assert.ok(steps.some((step) => step.id === "lugar"));
    assert.ok(!steps.some((step) => ["produccion", "catering", "requisitos"].includes(step.id)));
  }
});

test("el lugar informativo permite catálogo y texto libre, incluso vacío o precargado", () => {
  for (const lugar of ["", "Sede del catálogo", "Domicilio propio 123"]) {
    const props = {
      stepId: "lugar", tipoSeleccionados: ["Solo informar"], lugar, setLugar: () => {},
      areaSolicitante: "Relaciones Gubernamentales",
      datosProduccion: {}, lugaresOpciones: [{ value: "Sede del catálogo", label: "Sede del catálogo" }],
    } as EventFormWizardContentProps;
    const html = renderToStaticMarkup(React.createElement(EventFormWizardContent, props));
    assert.ok(html.includes("Lugar del evento (opcional)"));
    assert.ok(html.includes(`value="${lugar}"`));
    assert.ok(!html.includes("Posibles locaciones"));
    assert.ok(!html.includes("required"));
  }
});

test("los eventos con soporte conservan el selector de hasta tres locaciones", () => {
  const props = {
    stepId: "lugar", tipoSeleccionados: ["Producción"], datosProduccion: { locacionesPosibles: "Sede A;;Sede B" },
    areaSolicitante: "Relaciones Gubernamentales",
    lugaresOpciones: [], lugaresSugeridos: [],
  } as unknown as EventFormWizardContentProps;
  const html = renderToStaticMarkup(React.createElement(EventFormWizardContent, props));
  assert.ok(html.includes("Posibles locaciones"));
  assert.ok(html.includes("Máximo 3"));
});
