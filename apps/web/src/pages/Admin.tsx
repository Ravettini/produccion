import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { listUsers, createUser, updateUser, deleteUser, getMetrics, vaciarApp } from "../api/users";
import type { Role } from "../types";
import {
  Button,
  Badge,
  Card,
  CardBody,
  Modal,
  Input,
  Select,
  EmptyState,
} from "../components/ui";
import {
  roleLabels,
  eventStatusLabels,
  proposalStatusLabels,
  categoryLabels,
} from "../utils/labels";
import { AREAS_OPTIONS } from "../config/areas";
import { formatDateShort } from "../utils/formatters";

const roleOptions = (Object.entries(roleLabels) as [Role, string][]).map(([value, label]) => ({
  value,
  label,
}));

export default function Admin() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createName, setCreateName] = useState("");
  const [createRole, setCreateRole] = useState<Role>("ORGANIZACION");
  const [createArea, setCreateArea] = useState("");
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<Role>("ORGANIZACION");
  const [editArea, setEditArea] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [showVaciarConfirm, setShowVaciarConfirm] = useState(false);

  if (user?.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: listUsers,
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["admin", "metrics"],
    queryFn: getMetrics,
  });

  const create = useMutation({
    mutationFn: () =>
      createUser({
        email: createEmail,
        password: createPassword,
        name: createName,
        role: createRole,
        area: createArea.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      setShowCreate(false);
      setCreateEmail("");
      setCreatePassword("");
      setCreateName("");
      setCreateRole("ORGANIZACION");
      setCreateArea("");
    },
  });

  const update = useMutation({
    mutationFn: () => {
      if (!editingId) throw new Error("Sin usuario");
      const data: { name?: string; role?: string; area?: string | null; password?: string } = {
        name: editName,
        role: editRole,
        area: editArea.trim() || null,
      };
      if (editPassword.trim()) data.password = editPassword;
      return updateUser(editingId, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      setEditingId(null);
      setEditPassword("");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      setDeleteId(null);
    },
  });

  const vaciar = useMutation({
    mutationFn: vaciarApp,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "metrics"] });
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["events"] });
      setShowVaciarConfirm(false);
    },
  });

  const openEdit = (u: { id: string; name: string; role: string; area?: string | null }) => {
    setEditingId(u.id);
    setEditName(u.name);
    setEditArea(u.area ?? "");
    setEditRole(u.role as Role);
    setEditPassword("");
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Administración</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={() => setShowVaciarConfirm(true)}
            className="text-red-600 hover:text-red-800 hover:bg-red-50"
          >
            Vaciar app
          </Button>
          <Button onClick={() => setShowCreate(true)}>Nuevo usuario</Button>
        </div>
      </div>

      {/* Panel de métricas */}
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Métricas</h2>
      {metricsLoading ? (
        <div className="mb-8 text-slate-600">Cargando métricas…</div>
      ) : metrics ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 mb-8">
          <Card>
            <CardBody className="py-4">
              <p className="text-sm text-slate-600">Eventos confirmados</p>
              <p className="text-2xl font-bold text-emerald-600">
                {metrics.eventsByStatus?.CONFIRMADO ?? 0}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <p className="text-sm text-slate-600">Total eventos</p>
              <p className="text-2xl font-bold text-slate-800">{metrics.totalEvents ?? 0}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <p className="text-sm text-slate-600">Propuestas aprobadas</p>
              <p className="text-2xl font-bold text-emerald-600">
                {metrics.proposalsByStatus?.APPROVED ?? 0}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <p className="text-sm text-slate-600">Total propuestas</p>
              <p className="text-2xl font-bold text-slate-800">{metrics.totalProposals ?? 0}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <p className="text-sm text-slate-600">Tasa conversión</p>
              <p className="text-2xl font-bold text-slate-800">{metrics.tasaConversion ?? 0}%</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <p className="text-sm text-slate-600">Tasa rechazo propuestas</p>
              <p className="text-2xl font-bold text-slate-800">{metrics.tasaRechazo ?? 0}%</p>
            </CardBody>
          </Card>
        </div>
      ) : null}

      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-600 mb-2">Eventos por estado</h3>
        {metrics ? (
          <div className="flex flex-wrap gap-2">
            {(Object.entries(metrics.eventsByStatus ?? {}) as [string, number][]).map(
              ([status, count]) => (
                <span
                  key={status}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm"
                >
                  <span>{eventStatusLabels[status as keyof typeof eventStatusLabels] ?? status}:</span>
                  <span className="font-semibold">{count}</span>
                </span>
              )
            )}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">—</p>
        )}
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-medium text-slate-600 mb-2">Propuestas por estado</h3>
        {metrics ? (
          <div className="flex flex-wrap gap-2">
            {(Object.entries(metrics.proposalsByStatus ?? {}) as [string, number][]).map(
              ([status, count]) => (
                <span
                  key={status}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm"
                >
                  <span>
                    {proposalStatusLabels[status as keyof typeof proposalStatusLabels] ?? status}:
                  </span>
                  <span className="font-semibold">{count}</span>
                </span>
              )
            )}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">—</p>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-600 mb-2">Eventos por requerimiento (Producción, Institucionales, Cobertura)</h3>
        {metrics?.eventosPorRequerimiento ? (
          <div className="flex flex-wrap gap-2">
            {(Object.entries(metrics.eventosPorRequerimiento) as [string, number][]).map(
              ([area, count]) => (
                <span
                  key={area}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#153244]/10 text-[#153244] text-sm font-medium"
                >
                  <span>{area}:</span>
                  <span className="font-bold">{count}</span>
                </span>
              )
            )}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">—</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardBody className="py-3">
            <p className="text-xs text-slate-600">Eventos sin propuestas aprobadas</p>
            <p className="text-xl font-bold text-amber-600">{metrics?.eventosSinPropuestasAprobadas ?? 0}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="py-3">
            <p className="text-xs text-slate-600">Eventos con brief</p>
            <p className="text-xl font-bold text-emerald-600">{metrics?.eventosConBrief ?? 0}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="py-3">
            <p className="text-xs text-slate-600">Propuestas pendientes validación</p>
            <p className="text-xl font-bold text-amber-600">{metrics?.propuestasPendientes ?? 0}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="py-3">
            <p className="text-xs text-slate-600">Tiempo promedio aprobación (días)</p>
            <p className="text-xl font-bold text-slate-800">
              {metrics?.tiempoPromedioAprobacionDias ?? "—"}
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <Card>
          <CardBody className="py-3">
            <p className="text-xs text-slate-600">Eventos confirmados este mes</p>
            <p className="text-xl font-bold text-emerald-600">{metrics?.eventosConfirmadosEsteMes ?? 0}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="py-3">
            <p className="text-xs text-slate-600">Eventos confirmados mes anterior</p>
            <p className="text-xl font-bold text-slate-800">{metrics?.eventosConfirmadosMesAnterior ?? 0}</p>
          </CardBody>
        </Card>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-600 mb-2">Eventos por área solicitante</h3>
        {metrics?.eventosPorAreaSolicitante && Object.keys(metrics.eventosPorAreaSolicitante).length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {(Object.entries(metrics.eventosPorAreaSolicitante) as [string, number][]).map(
              ([area, count]) => (
                <Badge key={area} variant="secondary">{area}: {count}</Badge>
              )
            )}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">—</p>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-600 mb-2">Eventos por tipo de público</h3>
        {metrics?.eventosPorPublico && Object.keys(metrics.eventosPorPublico).length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {(Object.entries(metrics.eventosPorPublico) as [string, number][]).map(
              ([pub, count]) => (
                <Badge key={pub} variant="secondary">{pub}: {count}</Badge>
              )
            )}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">—</p>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-600 mb-2">Eventos por mes (últimos 12)</h3>
        {metrics?.eventosPorMes && Object.keys(metrics.eventosPorMes).length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {(Object.entries(metrics.eventosPorMes) as [string, number][]).map(
              ([mes, count]) => (
                <Badge key={mes} variant="secondary">{mes}: {count}</Badge>
              )
            )}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">—</p>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-600 mb-2">Propuestas por categoría</h3>
        {metrics?.proposalsByCategory && Object.keys(metrics.proposalsByCategory).length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {(Object.entries(metrics.proposalsByCategory) as [string, number][]).map(
              ([cat, count]) => (
                <Badge key={cat} variant="secondary">
                  {categoryLabels[cat as keyof typeof categoryLabels] ?? cat}: {count}
                </Badge>
              )
            )}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">—</p>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-600 mb-2">Propuestas por impacto</h3>
        {metrics?.proposalsByImpact && Object.keys(metrics.proposalsByImpact).length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {(Object.entries(metrics.proposalsByImpact) as [string, number][]).map(
              ([imp, count]) => (
                <Badge key={imp} variant="secondary">{imp}: {count}</Badge>
              )
            )}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">—</p>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-600 mb-2">Propuestas aprobadas por validador</h3>
        {metrics?.propuestasPorValidador && Object.keys(metrics.propuestasPorValidador).length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {(Object.entries(metrics.propuestasPorValidador) as [string, number][]).map(
              ([name, count]) => (
                <Badge key={name} variant="secondary">{name}: {count}</Badge>
              )
            )}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">—</p>
        )}
      </div>

      {(metrics?.evolucionEventos?.length ?? 0) > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-slate-600 mb-3">Evolución últimos 12 meses</h3>
          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardBody className="py-4">
                <p className="text-xs font-medium text-slate-600 mb-3">Eventos creados</p>
                <div className="flex items-end gap-1 h-24">
                  {metrics.evolucionEventos.map(({ mes, cantidad }) => {
                    const max = Math.max(...metrics.evolucionEventos!.map((e) => e.cantidad), 1);
                    const h = (cantidad / max) * 100;
                    return (
                      <div key={mes} className="flex-1 flex flex-col items-center gap-0.5">
                        <div
                          className="w-full bg-[#153244]/80 rounded-t min-h-[4px]"
                          style={{ height: `${Math.max(h, 4)}%` }}
                        />
                        <span className="text-[10px] text-slate-500 truncate max-w-full">{mes}</span>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="py-4">
                <p className="text-xs font-medium text-slate-600 mb-3">Propuestas creadas</p>
                <div className="flex items-end gap-1 h-24">
                  {metrics.evolucionPropuestas?.map(({ mes, cantidad }) => {
                    const max = Math.max(...(metrics.evolucionPropuestas ?? []).map((e) => e.cantidad), 1);
                    const h = (cantidad / max) * 100;
                    return (
                      <div key={mes} className="flex-1 flex flex-col items-center gap-0.5">
                        <div
                          className="w-full bg-emerald-600/80 rounded-t min-h-[4px]"
                          style={{ height: `${Math.max(h, 4)}%` }}
                        />
                        <span className="text-[10px] text-slate-500 truncate max-w-full">{mes}</span>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold text-slate-800 mb-4">Usuarios</h2>
      <Card>
        {isLoading ? (
          <CardBody>
            <div className="py-8 text-center text-slate-600">Cargando usuarios…</div>
          </CardBody>
        ) : users.length === 0 ? (
          <CardBody>
            <EmptyState
              title="No hay usuarios"
              description="Creá el primero desde «Nuevo usuario»."
              action={
                <Button onClick={() => setShowCreate(true)}>Nuevo usuario</Button>
              }
            />
          </CardBody>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="text-left px-3 sm:px-4 py-3 font-medium">Email</th>
                  <th className="text-left px-3 sm:px-4 py-3 font-medium">Nombre</th>
                  <th className="text-left px-3 sm:px-4 py-3 font-medium">Rol</th>
                  <th className="text-left px-3 sm:px-4 py-3 font-medium hidden lg:table-cell">Área</th>
                  <th className="text-left px-3 sm:px-4 py-3 font-medium hidden md:table-cell">Alta</th>
                  <th className="text-right px-3 sm:px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-3 sm:px-4 py-3 text-slate-800">{u.email}</td>
                    <td className="px-3 sm:px-4 py-3 text-slate-800">{u.name}</td>
                    <td className="px-3 sm:px-4 py-3">
                      <Badge
                        className={
                          u.role === "ADMIN"
                            ? "bg-gov-200 text-gov-800"
                            : u.role === "DIRECTOR_GENERAL"
                            ? "bg-indigo-100 text-indigo-800"
                            : u.role === "VALIDADOR"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-200 text-slate-700"
                        }
                      >
                        {roleLabels[u.role as Role]}
                      </Badge>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-slate-600 text-sm hidden lg:table-cell">{u.area ?? "—"}</td>
                    <td className="px-3 sm:px-4 py-3 text-slate-600 text-xs hidden md:table-cell">
                      {u.createdAt ? formatDateShort(u.createdAt) : "—"}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(u)}
                        className="mr-2"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(u.id)}
                        disabled={u.id === user?.id}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal title="Nuevo usuario" open={showCreate} onClose={() => setShowCreate(false)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
          className="space-y-3"
        >
          <Input
            label="Email"
            type="email"
            value={createEmail}
            onChange={(e) => setCreateEmail(e.target.value)}
            required
          />
          <Input
            label="Contraseña"
            type="password"
            value={createPassword}
            onChange={(e) => setCreatePassword(e.target.value)}
            required
            minLength={6}
          />
          <Input
            label="Nombre"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            required
          />
          <Select
            label="Rol"
            options={roleOptions}
            value={createRole}
            onChange={(e) => setCreateRole(e.target.value as Role)}
          />
          <Select
            label="Área (opcional)"
            options={[{ value: "", label: "— Sin área —" }, ...AREAS_OPTIONS]}
            value={createArea}
            onChange={(e) => setCreateArea(e.target.value)}
          />
          {create.error && (
            <p className="text-red-600 text-sm">{create.error.message}</p>
          )}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Creando…" : "Crear"}
            </Button>
            <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal title="Editar usuario" open={!!editingId} onClose={() => setEditingId(null)}>
        {editingId && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              update.mutate();
            }}
            className="space-y-3"
          >
            <Input
              label="Nombre"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
            <Select
              label="Rol"
              options={roleOptions}
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as Role)}
            />
            <Select
              label="Área (opcional)"
              options={[{ value: "", label: "— Sin área —" }, ...AREAS_OPTIONS]}
              value={editArea}
              onChange={(e) => setEditArea(e.target.value)}
            />
            <Input
              label="Nueva contraseña (opcional)"
              type="password"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              placeholder="Dejar vacío para no cambiar"
            />
            {update.error && (
              <p className="text-red-600 text-sm">{update.error.message}</p>
            )}
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={update.isPending}>
                {update.isPending ? "Guardando…" : "Guardar"}
              </Button>
              <Button variant="secondary" type="button" onClick={() => setEditingId(null)}>
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        title="Eliminar usuario"
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
      >
        {deleteId && (
          <div className="space-y-4">
            <p className="text-slate-600">
              ¿Estás seguro de que querés eliminar a{" "}
              {users.find((u) => u.id === deleteId)?.email}?
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setDeleteId(null)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={() => remove.mutate(deleteId)}
                disabled={remove.isPending}
              >
                Eliminar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="Vaciar app"
        open={showVaciarConfirm}
        onClose={() => setShowVaciarConfirm(false)}
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            ¿Estás seguro? Se eliminarán todos los eventos, propuestas y adjuntos. Los usuarios se mantienen. Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowVaciarConfirm(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => vaciar.mutate()}
              disabled={vaciar.isPending}
            >
              {vaciar.isPending ? "Vaciando…" : "Vaciar todo"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
