# Descripción completa del sistema: Gestión de Eventos y Propuestas Institucionales

## 1. Propósito general

Sistema web para gestionar **eventos institucionales** y sus **propuestas** (logística, catering, técnica, agenda, etc.). Permite crear eventos, cargar propuestas por área, validarlas (aprobar/rechazar), generar un **brief** redactado con IA a partir de lo aprobado, y exportarlo a Word. Incluye roles y permisos: solo ADMIN puede confirmar eventos y aprobar/rechazar propuestas.

---

## 2. Stack tecnológico

- **Monorepo** con `apps/api` (backend) y `apps/web` (frontend)
- **Backend:** Node.js, Express, TypeScript, Prisma (SQLite en desarrollo, migrable a PostgreSQL)
- **Frontend:** React, Vite, TypeScript, Tailwind CSS, React Router, React Query
- **Auth:** JWT (Bearer token)
- **IA:** Google Generative AI (Gemini/Gemma) para redactar briefs

---

## 3. Modelo de datos (Prisma)

### User
- `id`, `email` (único), `password` (hash bcrypt), `name`, `role`, `createdAt`, `updatedAt`
- **Roles:** `ADMIN`, `ORGANIZACION`, `PRODUCCION`, `AGENDA`, `VALIDADOR`

### Event
- `id`, `titulo`, `descripcion`, `tipoEvento`, `areaSolicitante`, `fechaTentativa`, `estado`, `resumen`, `createdAt`, `updatedAt`
- **Estados:** `BORRADOR`, `EN_ANALISIS`, `CONFIRMADO`, `CANCELADO`
- `resumen`: texto libre que resume lugar, producción, catering, etc. (editable manualmente o generado por IA)

### Proposal
- `id`, `eventId`, `titulo`, `descripcion`, `categoria`, `impacto`, `estado`, `createdById`, `validatedById`, `decisionReason`, `createdAt`, `updatedAt`
- **Categorías:** `LOGISTICA`, `CATERING`, `TECNICA`, `AGENDA`, `OTRO`
- **Impacto:** `ALTO`, `MEDIO`, `BAJO`
- **Estados:** `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`, `CANCELLED`

### ProposalComment
- `id`, `proposalId`, `userId`, `body`, `createdAt`

### ProposalAudit
- `id`, `proposalId`, `userId`, `action`, `fromStatus`, `toStatus`, `reason`, `createdAt`
- **Acciones:** `CREATE`, `SUBMIT`, `APPROVE`, `REJECT`, `CANCEL`

### Config
- `id`, `key`, `value` — clave-valor para configuración (ej: API key y modelo de IA)

---

## 4. Sistema de roles y permisos

| Acción | Quién puede |
|--------|-------------|
| Ver eventos, propuestas, calendario | Cualquier usuario autenticado |
| Crear evento | Cualquier usuario autenticado |
| Editar evento | Cualquier usuario autenticado |
| **Poner evento en CONFIRMADO** | **Solo ADMIN** |
| Crear propuesta | ORGANIZACION, PRODUCCION, AGENDA, ADMIN |
| Editar propuesta (solo DRAFT) | Creador o ADMIN |
| Enviar propuesta (DRAFT → SUBMITTED) | Creador o ADMIN |
| **Aprobar propuesta (SUBMITTED → APPROVED)** | **Solo ADMIN** |
| **Rechazar propuesta (SUBMITTED → REJECTED)** | **Solo ADMIN** (requiere `decisionReason`) |
| Cancelar propuesta | Creador o ADMIN |
| Comentar propuesta | Cualquier usuario autenticado |
| Generar brief con IA | Cualquier usuario autenticado |
| CRUD usuarios (crear, editar, eliminar) | Solo ADMIN |

---

## 5. API REST (Backend)

**Base URL:** `http://localhost:4000` (o `VITE_API_BASE` en frontend)

### Auth
- `POST /auth/login` — Body: `{ email, password }` → `{ token, user }`
- `GET /auth/me` — Usuario actual (requiere Bearer token)
- `POST /auth/register` — Crear usuario (solo ADMIN) — Body: `{ email, password, name, role }`

### Eventos
- `GET /events` — Listado de eventos (con `_count.proposals`)
- `GET /events/:id` — Detalle de evento
- `POST /events` — Crear evento — Body: `{ titulo, descripcion, tipoEvento, areaSolicitante, fechaTentativa, estado?, resumen? }`
- `PUT /events/:id` — Editar evento (mismo body, campos opcionales)
- `POST /events/:id/generar-brief-ia` — Genera brief con IA a partir del evento y propuestas aprobadas → `{ brief: string }`

### Propuestas
- `GET /events/:eventId/proposals` — Listado de propuestas del evento
- `POST /events/:eventId/proposals` — Crear propuesta — Body: `{ titulo, descripcion, categoria?, impacto? }`
- `GET /proposals/:id` — Detalle con `createdBy`, `validatedBy`, `event`, `comments`, `audits`
- `PUT /proposals/:id` — Editar (solo DRAFT, creador o ADMIN)
- `POST /proposals/:id/submit` — DRAFT → SUBMITTED
- `POST /proposals/:id/approve` — SUBMITTED → APPROVED (solo ADMIN)
- `POST /proposals/:id/reject` — SUBMITTED → REJECTED — Body: `{ decisionReason }` (solo ADMIN)
- `POST /proposals/:id/cancel` — DRAFT/SUBMITTED → CANCELLED
- `GET /proposals/:id/comments` — Comentarios
- `POST /proposals/:id/comments` — Crear comentario — Body: `{ body }`

### Admin (solo ADMIN)
- `GET /admin/users` — Listado de usuarios
- `PUT /admin/users/:id` — Editar usuario — Body: `{ name?, role?, password? }`
- `DELETE /admin/users/:id` — Eliminar usuario
- `GET /admin/config/ai` — Estado de config IA (configured, model)
- `PUT /admin/config/ai` — Guardar API key y modelo (Body: `{ apiKey?, model? }`)

### Health
- `GET /health` → `{ ok: true }`

---

## 6. Páginas del frontend (rutas)

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/login` | Login | Email + contraseña. Demo: admin@gobierno.gob / admin123 |
| `/` | EventList | Listado de eventos con link a detalle y crear nuevo |
| `/calendar` | Calendar | Vista mensual de eventos por fecha |
| `/admin` | Admin | Solo ADMIN: CRUD usuarios (crear, editar, eliminar) |
| `/events/new` | EventForm | Crear evento |
| `/events/:id` | EventDetail | Detalle de evento con 3 pestañas |
| `/events/:id/edit` | EventForm | Editar evento |
| `/proposals/:id` | ProposalDetail | Detalle de propuesta con acciones y comentarios |

---

## 7. Detalle por página

### Login
- Campos: email, contraseña
- Botón "Ingresar"
- Al loguear: guarda token en localStorage, redirige a `/`

### EventList
- Lista de eventos (título, estado, fecha, cantidad de propuestas)
- Botón "Nuevo evento"
- Links a cada evento y a editar

### EventForm (crear/editar)
- Campos: titulo, descripcion, tipoEvento, areaSolicitante, fechaTentativa, resumen (opcional)
- Selector de estado (BORRADOR, EN_ANALISIS, CONFIRMADO, CANCELADO) — solo ADMIN puede elegir CONFIRMADO
- Botón Guardar

### EventDetail
**3 pestañas:**
1. **Brief** — Muestra descripción, tipo, área, fecha del evento
2. **Estado de la información** — Sección "Resumen" con:
   - Botón "Generar brief con IA" — llama a la API, muestra modal con el texto generado
   - Botón "Agregar resumen" / "Editar resumen" — edición manual del resumen
   - Modal del brief generado: "Exportar como documento de Word" (.doc), "Cerrar", "Usar como resumen"
   - Listas: Información aprobada, Pendiente de validación, Rechazado (con propuestas agrupadas por estado)
3. **Propuestas** — Lista filtrable por estado y categoría, link "Nueva propuesta", formulario para crear propuesta

### ProposalDetail
- Muestra propuesta (título, descripción, categoría, impacto, estado, creador, validador)
- Acciones según estado: Enviar (DRAFT), Aprobar (SUBMITTED, solo ADMIN), Rechazar (SUBMITTED, solo ADMIN, requiere motivo), Cancelar
- Comentarios: lista y formulario para agregar
- Historial de auditoría (audits)

### Calendar
- Vista mensual con eventos por día
- Navegación entre meses

### Admin
- Tabla de usuarios: email, nombre, rol, fecha alta, acciones (Editar, Eliminar)
- Botón "Nuevo usuario"
- Modal crear: email, contraseña, nombre, rol
- Modal editar: nombre, rol, contraseña (opcional)

---

## 8. Flujo de trabajo típico

1. Usuario se loguea
2. Crea un evento (o usa uno existente)
3. Usuarios con rol ORGANIZACION/PRODUCCION/AGENDA crean propuestas (logística, catering, etc.)
4. Creador envía propuesta (DRAFT → SUBMITTED)
5. ADMIN aprueba o rechaza cada propuesta
6. En "Estado de la información", cualquier usuario puede hacer clic en "Generar brief con IA" para que la IA redacte un brief a partir del evento y las propuestas aprobadas
7. En el modal: puede exportar a Word (.doc) o usar el texto como resumen del evento
8. ADMIN puede poner el evento en CONFIRMADO cuando todo esté listo

---

## 9. Configuración IA (Brief con IA)

- **Backend:** La API key y el modelo se configuran en `apps/api/.env`:
  - `GOOGLE_AI_API_KEY` — API key de Google AI (https://aistudio.google.com/apikey)
  - `GOOGLE_AI_MODEL` — ej: `gemini-2.0-flash`, `gemma-2-9b-it` (default: gemini-2.0-flash)
- El frontend **no** pide la API key; todo se configura en el servidor
- El brief se genera con la información del evento y solo las propuestas en estado APPROVED

---

## 10. Exportar a Word

- En el modal "Brief generado con IA" hay un botón "Exportar como documento de Word"
- Genera un archivo `.doc` (HTML que Word abre) con el texto del brief
- Nombre del archivo: `Brief - [título del evento].doc`
- Se hace en el cliente (sin llamada al backend)

---

## 11. Variables de entorno

### Backend (apps/api/.env)
- `PORT` — Puerto (default 4000)
- `JWT_SECRET` — Secreto para JWT
- `DATABASE_URL` — URL de Prisma (default: SQLite `file:./dev.db`)
- `GOOGLE_AI_API_KEY` — API key de Google AI
- `GOOGLE_AI_MODEL` — Modelo (default: gemini-2.0-flash)
- `CORS_ORIGIN` — En producción, URL del frontend

### Frontend (apps/web/.env)
- `VITE_API_BASE` — URL de la API (default: http://localhost:4000)

---

## 12. Usuarios de prueba (seed)

- **admin@gobierno.gob** / admin123 — Rol ADMIN
- **validador@gobierno.gob** / admin123 — Rol VALIDADOR (pero solo ADMIN puede aprobar/rechazar en la implementación actual)

---

## 13. Comandos para levantar

```bash
npm run setup   # Primera vez: prepara .env, instala, crea DB, seed
npm run dev     # Levanta API (4000) y frontend (5173)
```

---

## 14. Resumen para nueva interfaz

Al diseñar una nueva UI, mantener:

- **Login** con email/password
- **Listado de eventos** con crear/editar
- **Detalle de evento** con 3 pestañas: Brief, Estado de la información (resumen + generar brief IA + listas aprobadas/pendientes/rechazadas), Propuestas
- **Modal del brief IA** con: ver texto, Exportar a Word, Usar como resumen, Cerrar
- **Detalle de propuesta** con acciones (enviar, aprobar, rechazar, cancelar), comentarios, auditoría
- **Calendario** mensual
- **Admin** (solo para ADMIN): CRUD usuarios
- **Navegación:** Eventos, Calendario, Administración (si ADMIN), usuario actual, Salir
- **Protección de rutas:** todo excepto /login requiere autenticación
- **Roles visibles** en la UI (ej: solo mostrar Aprobar/Rechazar si es ADMIN)
