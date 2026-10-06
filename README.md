# BandManager.io

Plataforma para bandas y artistas independientes que quieren dejar de perder horas buscando salas: **booking CRM con agentes de IA**, repertorio y setlists, EPK público, fans, finanzas de gira y generación de Reels. Es también el núcleo técnico de un Trabajo Fin de Máster sobre desarrollo de software asistido por IA agéntica (Máster de Desarrollo con IA, The Big School).

> Las reglas de desarrollo (seguridad, multi-tenancy, agentes, estilo) viven en **[AGENTS.md](./AGENTS.md)**. Este README es la puerta de entrada; no las duplica.

## Qué hace

| Área | Resumen |
|---|---|
| **Booking** | Scout de salas y festivales, Redactor de pitches, Enviador y Lector de respuestas sobre Gmail OAuth2 o IMAP/SMTP. |
| **Repertorio** | Canciones, setlists, análisis de tonalidad/BPM/energía, transiciones y exportación MIDI. |
| **EPK y fans** | Dossier web público, captación de fans con consentimiento RGPD, QR de conciertos. |
| **Gira y finanzas** | Conciertos, ensayos, acuerdos con la sala firmables por enlace, pagos. |
| **Contenido** | Reels virales a partir de vídeos de la banda, estudio de música IA y separación de stems. |

**Principio central: human-in-the-loop.** Ningún agente envía un email sin aprobación humana explícita (detalle en [AGENTS.md §3](./AGENTS.md)).

## Stack

- **Frontend:** React 19 + Vite 6 + Tailwind CSS v4, `motion`, Tone.js.
- **Backend:** Express 4 + TypeScript en Node 22 (`server.ts`), estado en memoria sincronizado con Supabase.
- **Datos:** Supabase (PostgreSQL) como única fuente de verdad, Supabase Storage para multimedia.
- **IA:** Gemini (`@google/genai`), con DeepSeek/OpenAI opcionales; Replicate/fal para stems.
- **Servicios:** Stripe (planes), Resend (emails transaccionales), Sentry (opcional).
- **Despliegue:** Railway (`railway.json`, healthcheck en `/api/health`); las migraciones SQL se aplican solas en `npm start`.

## Puesta en marcha

Requiere Node 22.

```bash
npm install
cp .env.example .env     # mínimo: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY
npm run dev              # Express + Vite en http://localhost:3000
```

Sin `.env` la app también arranca, con los usuarios semilla de `src/db_seed.ts` y estado en memoria, pero sin IA ni Supabase reales. Cada integración opcional (Stripe, Resend, Gmail OAuth, Sentry, stems) se degrada sola si falta su variable; la referencia completa está comentada en [`.env.example`](./.env.example).

`AGENT_EMAIL_MODE` está en `draft` por defecto: los agentes dejan borradores y **no envían** hasta que se pone a `send` en el servidor.

## Scripts

| Comando | Para qué |
|---|---|
| `npm run dev` | Servidor de desarrollo. |
| `npm run build` / `npm start` | Typecheck + build / migraciones y servidor de producción. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm test` | Tests unitarios (Vitest). |
| `npm run check:fast` | Typecheck + test de la frontera de confianza `band_id`. |
| `npm run test:e2e` | Smoke suite y journey de onboarding (Playwright, sin credenciales). |
| `npm run test:visual` | Regresión visual (`:update` solo para cambios de diseño deliberados). |
| `npm run lint:eslint` | ESLint (la deuda existente va con ratchet en CI). |
| `npm run migrate:check` | Lista las migraciones SQL pendientes. |
| `npm run verify:docs` | Comprueba que las rutas citadas en la documentación existen. |
| `npm run graph:sync` | Regenera el grafo de conocimiento de `docs/knowledge_graph/`. |

## Estructura

```
server/        Express: routes/ (HTTP) · services/ (agentes, scheduler, emails) · db/ (Supabase) · utils/ · middleware/
src/           React: components/ · hooks/ · utils/ · services/api.ts (cliente HTTP único) · context/
supabase/      Migraciones SQL idempotentes (el esquema completo está en supabase_schema.sql)
e2e/           Playwright: smoke, journey y regresión visual
scripts/       Migraciones, auditorías de diseño y utilidades de desarrollo
skills/        Skills para agentes de código (espejadas en .claude/, .gemini/, .opencode/ y .cursor/)
docs/          planes/ (especificaciones) · referencia/ (arquitectura, diseño) · knowledge_graph/ (Obsidian)
```

El mapa detallado está en [AGENTS.md §7](./AGENTS.md). El backlog de producto, en [BACKLOG.md](./BACKLOG.md).

## Documentación

- [AGENTS.md](./AGENTS.md): reglas del proyecto (precedencia sobre convenciones genéricas).
- [docs/referencia/](./docs/referencia/): arquitectura del motor de audio y stems, sistema de diseño Espectro, manual de negociación del Redactor, compatibilidad entre herramientas de IA.
- [docs/planes/](./docs/planes/): anti-fraude y acuerdos de gira, gestión de tokens IA, BandSplit.
- [docs/knowledge_graph/](./docs/knowledge_graph/index.md): grafo de arquitectura navegable en Obsidian.

## Estado

Proyecto en desarrollo activo. Antes de abrirlo a usuarios reales hay riesgos legales y de seguridad documentados en [AGENTS.md §8](./AGENTS.md) (descarga de YouTube, credenciales de email sin cifrar, baja en emails comerciales, RGPD).

## Licencia

El repositorio incluye [`LICENSE`](./LICENSE) (AGPL-3.0) y [`TERMS_OF_SERVICE.md`](./TERMS_OF_SERVICE.md) (todos los derechos reservados). **Ambos se contradicen**; está pendiente decidir cuál aplica.
