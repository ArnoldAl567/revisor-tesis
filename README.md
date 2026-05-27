# ThesisReview — Revisor de tesis con IA

Monorepo para revisión académica de avances de tesis: patrón institucional, análisis IA (OpenAI/Gemini), revisión humana, lotes, reportes y estadísticas.

## Stack

- **API:** NestJS 11, Prisma, MySQL 8, BullMQ, Redis
- **Web:** Next.js 16, Tailwind, Recharts
- **IA:** OpenAI GPT-4o y/o Google Gemini

## Requisitos

- Node.js 20+
- Docker (MySQL + Redis)
- Claves `OPENAI_API_KEY` y/o `GEMINI_API_KEY`

## Inicio rápido

```bash
# 1. Infraestructura
docker compose up -d

# 2. API
cd apps/api
cp .env.example .env   # si existe
npm install
npx prisma migrate deploy
npx prisma db seed
npm run start:dev

# 3. Web (otra terminal)
cd apps/web
npm install
npm run dev
```

- Web: http://localhost:3000  
- API: http://localhost:3001  
- Swagger: http://localhost:3001/docs  

## Usuarios demo (seed)

| Rol | Email | Contraseña |
|-----|-------|------------|
| Estudiante | alumno@test.com | Thesis123! |
| Asesor | asesor@test.com | Thesis123! |
| Coordinador | coord@test.com | Thesis123! |

## Variables de entorno (`apps/api/.env`)

```env
DATABASE_URL="mysql://root:root_password@localhost:3306/revisor_tesis2"
REDIS_HOST=localhost
REDIS_PORT=6379
OPENAI_API_KEY=
GEMINI_API_KEY=
JWT_SECRET=cambiar-en-produccion
PORT=3001
```

## Scripts raíz (desde la carpeta del proyecto)

```bash
npm install
npm run docker:up
npm run dev:api
npm run dev:web
```

## Módulos implementados

| Módulo | Ruta web | API principal |
|--------|----------|---------------|
| Patrones | `/config` | `/templates` |
| Dashboard | `/` | `/dashboard/overview` |
| Carga avances | `/upload` | `/advances/upload` |
| Revisión | `/reviews` | `/reviews/advances` |
| Lotes | `/bulk` | `/bulk/jobs` |
| Reportes | `/reports` | `/reports/acta/:id`, `.../pdf` |
| Estadísticas | `/stats` | `/stats/analytics` |
| Login | `/login` | `/auth/login` |

## Notas

- Archivos en `apps/api/uploads/` (no MinIO por defecto).
- Análisis IA asíncrono vía Redis; la UI de carga usa `sync=true` para resultado inmediato.
- PDF de actas generado con Puppeteer (misma dependencia que vista previa DOCX).

## Mejoras futuras

- Guards JWT globales, envío de reportes por email, detección de plagio, fine-tuning con feedback humano.
