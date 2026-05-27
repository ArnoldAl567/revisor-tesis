# Módulos integrados — ThesisReview

## Requisitos de infraestructura

```bash
docker compose up -d    # MySQL, Redis, MinIO
cd apps/api && npm run start:dev
cd apps/web && npm run dev
```

- **MySQL**: datos (`DATABASE_URL`)
- **Redis**: cola BullMQ para análisis en lote y asíncrono
- **API**: puerto 3001 · **Web**: puerto 3000

## Endpoints principales (API)

| Módulo | Rutas |
|--------|--------|
| 2 Patrones | `GET/POST /templates`, `POST /templates/upload`, `PATCH /templates/:id/rubric` |
| 3 Dashboard | `GET /dashboard/overview` |
| 4 Avances | `GET/POST /advances`, `POST /advances/upload`, `GET /advances/:id/file` |
| 5 IA | `GET /advances/ai-providers` + pipeline en upload/cola |
| 6 Revisión | `GET /reviews/advances`, `GET /reviews/advances/:id`, `PATCH`, anotaciones |
| 7 Lotes | `POST/GET /bulk/jobs` |
| 8 Reportes | `GET /reports/acta/:advanceId`, `GET /reports/versions/:groupId` |
| 9 Estadísticas | `GET /stats/analytics`, `GET /stats/export/csv` |
| Notificaciones | `GET /notifications`, `GET /notifications/stream` (SSE) |

## Páginas web

| Ruta | Módulo |
|------|--------|
| `/` | Dashboard KPIs, alertas &lt;60%, timeline |
| `/config` | Carga y listado de patrones institucionales |
| `/upload` | Carga de avances + análisis IA |
| `/reviews` | Lista de avances para revisar |
| `/reviews/[id]` | Vista documento + pestañas IA / humana |
| `/bulk` | Revisión por lotes con progreso |
| `/stats` | Gráficos y export CSV |

## Usuarios de prueba (seed)

- `alumno@test.com` / `Thesis123!` — estudiante
- `asesor@test.com` — asesor
- `coord@test.com` — coordinador

## Notas

- Upload con `sync=true` en formulario: análisis inmediato sin Redis.
- Sin `sync`: encola job (requiere Redis + worker Nest activo).
- Escala de nota configurable en tabla `InstitutionConfig` (default 0–20).
