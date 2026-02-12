# Gestión de Eventos — MVP

Web app para centralizar la carga de eventos (brief), propuestas por equipo y flujo de validación, con historial y trazabilidad.

## Stack

- **Backend:** Node.js, Express, TypeScript, PostgreSQL, Prisma, JWT, RBAC
- **Frontend:** React, Vite, TypeScript, Tailwind CSS, React Router, React Query
- **Estructura:** Monorepo (`apps/api`, `apps/web`)

## Requisitos

- Node.js 18+
- npm 9+

## Cómo correr el proyecto en local

### Un solo comando (sin instalar base de datos)

Por defecto usa **SQLite** (un archivo `prisma/dev.db`), así que no hace falta PostgreSQL ni crear ninguna base.

Desde la raíz del proyecto:

```bash
npm run start
```

La primera vez puede crear `apps/api/.env` desde el ejemplo y cortar; en ese caso ejecutá de nuevo `npm run start`.

Ese comando hace: preparar `.env` si falta → `npm install` → Prisma generate → crear/sincronizar DB (SQLite) → seed → levanta API y web.

- **Web:** http://localhost:5173  
- **API:** http://localhost:4000  

En Windows también podés usar **`start.bat`** (o doble clic).

---

### Pasar a Supabase (PostgreSQL) después

Cuando quieras usar Supabase en lugar del SQLite local:

1. Creá un proyecto en [supabase.com](https://supabase.com), entrá a **Settings → Database** y copiá la **Connection string** (URI).
2. En `apps/api/prisma/schema.prisma` cambiá el datasource a:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. En `apps/api/.env` agregá:
   ```env
   DATABASE_URL="postgresql://postgres.[PROYECTO]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```
   (usá la URL que te da Supabase).
4. Desde la raíz: `npm run db:generate && npm run db:deploy && npm run db:seed` (las migraciones actuales son para PostgreSQL).

---

### Paso a paso (opcional)

### 1. Variables de entorno del backend

En `apps/api`: copiá `.env.example` a `.env`. Opcional: editá `JWT_SECRET`.

### 2. Instalar dependencias

Desde la raíz del repo:

```bash
npm install
```

### 3. Base de datos y seed (backend)

En `apps/api` (local con SQLite):

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 4. Levantar API y frontend

Desde la raíz:

```bash
npm run dev
```

Eso arranca:

- **API:** http://localhost:4000  
- **Web:** http://localhost:5173  

Solo backend:

```bash
npm run dev:api
```

Solo frontend:

```bash
npm run dev:web
```

### 5. Usuarios de prueba (seed)

Tras el seed tenés:

| Email                   | Contraseña | Rol       |
|-------------------------|------------|-----------|
| admin@gobierno.gob      | admin123   | ADMIN     |
| validador@gobierno.gob  | admin123   | VALIDADOR |

Con **admin** podés crear eventos, propuestas, aprobar y rechazar, y entrar a **Administración** para gestionar usuarios (listar, crear, editar rol/nombre/contraseña, eliminar).  
Con **validador** solo aprobar/rechazar propuestas en estado “Enviada”.

## Estructura del repo

```
/
├── apps/
│   ├── api/                  # Backend Express + Prisma
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── seed.ts
│   │   │   └── migrations/
│   │   └── src/
│   │       ├── index.ts
│   │       ├── lib/
│   │       ├── middleware/
│   │       └── routes/
│   └── web/                  # Frontend Vite + React
│       ├── src/
│       │   ├── api/
│       │   ├── components/
│       │   ├── context/
│       │   ├── pages/
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── index.html
│       └── vite.config.ts
├── package.json              # Workspaces: api, web
└── README.md
```

## API (resumen)

- **Auth:** `POST /auth/login`, `POST /auth/register` (admin), `GET /auth/me`
- **Eventos:** `GET/POST /events`, `GET/PUT /events/:id`
- **Propuestas:**  
  `GET/POST /events/:id/proposals`  
  `GET/PUT /proposals/:id`  
  `POST /proposals/:id/submit`, `.../approve`, `.../reject`, `.../cancel`  
  `GET/POST /proposals/:id/comments`

Las rutas (salvo login) exigen header `Authorization: Bearer <token>`.

## Roles y permisos (RBAC)

- **ADMIN:** todo (eventos, propuestas, aprobar/rechazar, usuarios).
- **ORGANIZACION / PRODUCCION / AGENDA:** ver eventos y crear/ver propuestas; no pueden aprobar ni rechazar.
- **VALIDADOR:** ver eventos y propuestas; puede aprobar o rechazar propuestas enviadas.

Nadie puede editar una propuesta después de que pasa a SUBMITTED.  
Todo cambio de estado se registra en historial (auditoría).

## Definición de terminado (MVP)

- [x] Crear y editar eventos (brief)
- [x] Crear propuestas por evento (ideas/avances)
- [x] Flujo: DRAFT → SUBMITTED → APPROVED / REJECTED
- [x] Comentarios y historial por propuesta
- [x] Roles y validación por JWT
- [x] UI responsive

## Build para producción

```bash
npm run build
```

En `apps/api` conviene servir con `node dist/index.js` (o un proceso tipo PM2) y en `apps/web` los estáticos con Nginx u otro servidor.  
Configurar en frontend `VITE_API_BASE` con la URL pública de la API.
