# Referencia de la API

> Generado automáticamente por `scripts/generate-openapi.mjs` a partir del código. No se edita a mano: ejecuta `npm run docs:api`.

**358 rutas HTTP** (307 declaraciones de handler; el resto son alias) en 31 dominios. Contrato máquina-legible: [`openapi.json`](./openapi.json) (OpenAPI 3.1). Visor interactivo: [`index.html`](./index.html) (hay que abrirlo en un navegador; GitHub no lo renderiza). Decisión de diseño: [ADR 0012](../adr/0012-contrato-api-openapi-por-ast.md).

## Cómo leerla

- **Acceso** es lo que el código muestra, no lo que se supone. Una ruta "Pública" es una ruta sin ninguna comprobación detectada; puede ser intencionada (login, páginas públicas) y conviene revisarla.
- **Esquema ★** significa que la petición y la respuesta están descritas a mano en [`overrides.json`](./overrides.json). El resto solo documenta la superficie (método, ruta, acceso, límites, código): el proyecto no usa una librería de validación de la que derivar esquemas.
- La banda activa se envía en la cabecera `x-band-id` y el servidor la valida contra las bandas del usuario ([ADR 0004](../adr/0004-band-id-resuelto-en-servidor.md)).

| Acceso | Rutas |
|---|---|
| Sesión | 312 |
| Sesión (comprobada en el handler) | 6 |
| Sesión opcional | 3 |
| Firma o secreto | 7 |
| Pública | 30 |

## Rutas sin sesión de middleware

Son las que un revisor de seguridad querrá mirar primero.

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/ai-stem-separation/fal-webhook` | Pública | — |  | [`server/routes/ai_music.ts:2472`](../../server/routes/ai_music.ts#L2472) |
| `GET` | `/api/api/tracking/click` | Pública | — |  | [`server/routes/tracking.ts:144`](../../server/routes/tracking.ts#L144) |
| `POST` | `/api/api/tracking/interaction` | Pública | — |  | [`server/routes/tracking.ts:255`](../../server/routes/tracking.ts#L255) |
| `GET` | `/api/api/tracking/open` | Pública | — |  | [`server/routes/tracking.ts:51`](../../server/routes/tracking.ts#L51) |
| `GET` | `/api/api/tracking/pdf` | Pública | — |  | [`server/routes/tracking.ts:323`](../../server/routes/tracking.ts#L323) |
| `POST` | `/api/api/webhooks/replicate-stems` | Firma o secreto | — |  | [`server/routes/ai_music.ts:4099`](../../server/routes/ai_music.ts#L4099) |
| `POST` | `/api/auth/activate-member` | Sesión opcional | loginRateLimiter |  | [`server/routes/users.ts:863`](../../server/routes/users.ts#L863) |
| `POST` | `/api/auth/check-invitation` | Pública | loginRateLimiter |  | [`server/routes/users.ts:807`](../../server/routes/users.ts#L807) |
| `POST` | `/api/auth/google` | Sesión (comprobada en el handler) | loginRateLimiter |  | [`server/routes/users.ts:977`](../../server/routes/users.ts#L977) |
| `POST` | `/api/auth/login` | Sesión (comprobada en el handler) | loginRateLimiter | ★ | [`server/routes/users.ts:1351`](../../server/routes/users.ts#L1351) |
| `POST` | `/api/auth/logout` | Sesión opcional | — |  | [`server/routes/users.ts:2241`](../../server/routes/users.ts#L2241) |
| `GET` | `/api/auth/me` | Sesión (comprobada en el handler) | — |  | [`server/routes/users.ts:1887`](../../server/routes/users.ts#L1887) |
| `POST` | `/api/auth/register` | Sesión opcional | registroRateLimiter |  | [`server/routes/users.ts:505`](../../server/routes/users.ts#L505) |
| `POST` | `/api/auth/reset-password/confirm` | Firma o secreto | loginRateLimiter |  | [`server/routes/users.ts:1720`](../../server/routes/users.ts#L1720) |
| `POST` | `/api/auth/reset-password/request` | Pública | loginRateLimiter |  | [`server/routes/users.ts:1533`](../../server/routes/users.ts#L1533) |
| `POST` | `/api/auth/switch-band` | Sesión (comprobada en el handler) | — |  | [`server/routes/users.ts:2031`](../../server/routes/users.ts#L2031) |
| `POST` | `/api/billing/webhook` | Firma o secreto | — |  | [`server/routes/billing.ts:973`](../../server/routes/billing.ts#L973) |
| `GET` | `/api/calendar.ics` | Firma o secreto | — |  | [`server/routes/concerts.ts:432`](../../server/routes/concerts.ts#L432) |
| `GET` | `/api/download-excel` | Sesión (comprobada en el handler) | — |  | [`server.ts:254`](../../server.ts#L254) |
| `GET` | `/api/gmail-oauth/callback` | Pública | — |  | [`server/routes/gmailOAuth.ts:149`](../../server/routes/gmailOAuth.ts#L149) |
| `GET` | `/api/health` | Pública | — | ★ | [`server.ts:165`](../../server.ts#L165) |
| `GET` | `/api/public/deals/{token}` | Pública | — |  | [`server/routes/deals.ts:209`](../../server/routes/deals.ts#L209) |
| `POST` | `/api/public/deals/{token}/resend-email` | Pública | reenvioEmailRateLimiter |  | [`server/routes/deals.ts:434`](../../server/routes/deals.ts#L434) |
| `POST` | `/api/public/deals/{token}/sign` | Pública | — | ★ | [`server/routes/deals.ts:288`](../../server/routes/deals.ts#L288) |
| `GET` | `/api/public/epk` | Pública | — |  | [`server/routes/epk_fans.ts:467`](../../server/routes/epk_fans.ts#L467) |
| `POST` | `/api/public/fans` | Pública | publicoRateLimiter | ★ | [`server/routes/epk_fans.ts:868`](../../server/routes/epk_fans.ts#L868) |
| `GET` | `/api/public/insignia` | Pública | publicoRateLimiter |  | [`server/routes/referidos.ts:76`](../../server/routes/referidos.ts#L76) |
| `POST` | `/api/public/musicians-waitlist` | Pública | publicoRateLimiter |  | [`server/routes/epk_fans.ts:1118`](../../server/routes/epk_fans.ts#L1118) |
| `POST` | `/api/public/track-click` | Pública | publicoRateLimiter |  | [`server/routes/epk_fans.ts:979`](../../server/routes/epk_fans.ts#L979) |
| `GET` | `/api/r/{code}` | Pública | publicoRateLimiter |  | [`server/routes/enlacesCortos.ts:49`](../../server/routes/enlacesCortos.ts#L49) |
| `GET` | `/api/spotify/status` | Pública | — |  | [`server/routes/spotify.ts:19`](../../server/routes/spotify.ts#L19) |
| `GET` | `/api/state` | Sesión (comprobada en el handler) | — |  | [`server.ts:495`](../../server.ts#L495) |
| `POST` | `/api/stripe/webhook` | Firma o secreto | — |  | [`server/routes/billing.ts:974`](../../server/routes/billing.ts#L974) |
| `GET` | `/api/tracking/click` | Pública | — |  | [`server/routes/tracking.ts:144`](../../server/routes/tracking.ts#L144) |
| `POST` | `/api/tracking/interaction` | Pública | — |  | [`server/routes/tracking.ts:255`](../../server/routes/tracking.ts#L255) |
| `GET` | `/api/tracking/open` | Pública | — |  | [`server/routes/tracking.ts:51`](../../server/routes/tracking.ts#L51) |
| `GET` | `/api/tracking/pdf` | Pública | — |  | [`server/routes/tracking.ts:323`](../../server/routes/tracking.ts#L323) |
| `POST` | `/api/webhooks/replicate-stems` | Firma o secreto | — |  | [`server/routes/ai_music.ts:4099`](../../server/routes/ai_music.ts#L4099) |
| `POST` | `/api/webhooks/resend` | Firma o secreto | publicoRateLimiter |  | [`server/routes/tracking.ts:458`](../../server/routes/tracking.ts#L458) |
| `GET` | `/e/{slug}` | Pública | publicoRateLimiter |  | [`server/routes/paginaConcierto.ts:39`](../../server/routes/paginaConcierto.ts#L39) |
| `GET` | `/health` | Pública | — |  | [`server.ts:165`](../../server.ts#L165) |
| `GET` | `/privacy` | Pública | — |  | [`server.ts:179`](../../server.ts#L179) |
| `GET` | `/r/{code}` | Pública | publicoRateLimiter |  | [`server/routes/enlacesCortos.ts:49`](../../server/routes/enlacesCortos.ts#L49) |
| `GET` | `/robots.txt` | Pública | — |  | [`server/routes/paginaConcierto.ts:150`](../../server/routes/paginaConcierto.ts#L150) |
| `GET` | `/sitemap.xml` | Pública | publicoRateLimiter |  | [`server/routes/paginaConcierto.ts:132`](../../server/routes/paginaConcierto.ts#L132) |
| `GET` | `/terms` | Pública | — |  | [`server.ts:221`](../../server.ts#L221) |

## Operaciones con esquema documentado

- `GET /api/health`: Salud del servicio
- `POST /api/auth/login`: Iniciar sesión
- `GET /api/leads`: Listar salas de la banda activa
- `GET /api/leads/{id}`: Obtener una sala
- `POST /api/leads`: Crear una sala
- `PUT /api/leads/{id}`: Actualizar una sala (y aprobar)
- `POST /api/public/fans`: Registrar un fan (con consentimiento RGPD)
- `POST /api/public/deals/{token}/sign`: Firmar un acuerdo de concierto

## Todas las rutas por dominio

### agent

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/admin/agent-funnel` | Sesión | — |  | [`server/routes/agent.ts:1312`](../../server/routes/agent.ts#L1312) |
| `GET` | `/api/agent-logs` | Sesión | — |  | [`server/routes/agent.ts:1241`](../../server/routes/agent.ts#L1241) |
| `POST` | `/api/agent-logs` | Sesión | — |  | [`server/routes/agent.ts:1265`](../../server/routes/agent.ts#L1265) |
| `GET` | `/api/agent-runs` | Sesión | — |  | [`server/routes/agent.ts:1052`](../../server/routes/agent.ts#L1052) |
| `GET` | `/api/agent-runs/{runId}/jobs` | Sesión | — |  | [`server/routes/agent.ts:1121`](../../server/routes/agent.ts#L1121) |
| `POST` | `/api/agents/test-intel` | Sesión | — |  | [`server/routes/agent.ts:1013`](../../server/routes/agent.ts#L1013) |
| `POST` | `/api/internal/agents/responder-hilo` | Sesión | — |  | [`server/routes/agent.ts:969`](../../server/routes/agent.ts#L969) |
| `POST` | `/api/reset` | Sesión + líder | — |  | [`server/routes/agent.ts:1215`](../../server/routes/agent.ts#L1215) |
| `POST` | `/api/trigger-agent` | Sesión | — |  | [`server/routes/agent.ts:110`](../../server/routes/agent.ts#L110) |

### agentQueue

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/agent-queue/enqueue` | Sesión | — |  | [`server/routes/agentQueue.ts:62`](../../server/routes/agentQueue.ts#L62) |
| `GET` | `/api/agent-queue/metrics` | Sesión | — |  | [`server/routes/agentQueue.ts:34`](../../server/routes/agentQueue.ts#L34) |
| `POST` | `/api/agent-queue/prune` | Sesión | — |  | [`server/routes/agentQueue.ts:48`](../../server/routes/agentQueue.ts#L48) |
| `GET` | `/api/agent-queue/stats` | Sesión | — |  | [`server/routes/agentQueue.ts:20`](../../server/routes/agentQueue.ts#L20) |

### ai_music

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/ai-generate-instrument-track` | Sesión | iaRateLimiter |  | [`server/routes/ai_music.ts:3932`](../../server/routes/ai_music.ts#L3932) |
| `POST` | `/api/ai-stem-separation` | Sesión | iaRateLimiter |  | [`server/routes/ai_music.ts:2490`](../../server/routes/ai_music.ts#L2490) |
| `GET` | `/api/ai-stem-separation/fal-diagnostic` | Sesión | — |  | [`server/routes/ai_music.ts:3610`](../../server/routes/ai_music.ts#L3610) |
| `POST` | `/api/ai-stem-separation/fal-webhook` | Pública | — |  | [`server/routes/ai_music.ts:2472`](../../server/routes/ai_music.ts#L2472) |
| `GET` | `/api/ai-stem-separation/status` | Sesión | — |  | [`server/routes/ai_music.ts:3517`](../../server/routes/ai_music.ts#L3517) |
| `POST` | `/api/api/webhooks/replicate-stems` | Firma o secreto | — |  | [`server/routes/ai_music.ts:4099`](../../server/routes/ai_music.ts#L4099) |
| `POST` | `/api/generate` | Sesión | iaRateLimiter |  | [`server/routes/ai_music.ts:2371`](../../server/routes/ai_music.ts#L2371) |
| `POST` | `/api/generate-music` | Sesión | iaRateLimiter |  | [`server/routes/ai_music.ts:2371`](../../server/routes/ai_music.ts#L2371) |
| `POST` | `/api/webhooks/replicate-stems` | Firma o secreto | — |  | [`server/routes/ai_music.ts:4099`](../../server/routes/ai_music.ts#L4099) |

### bandMusic

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/bands/metricas` | Sesión | — |  | [`server/routes/bandMusic.ts:177`](../../server/routes/bandMusic.ts#L177) |
| `POST` | `/api/bands/metricas/actualizar` | Sesión | — |  | [`server/routes/bandMusic.ts:152`](../../server/routes/bandMusic.ts#L152) |
| `GET` | `/api/bands/previews-availability` | Sesión | — |  | [`server/routes/bandMusic.ts:56`](../../server/routes/bandMusic.ts#L56) |
| `POST` | `/api/bands/spotify-sweep` | Sesión | — |  | [`server/routes/bandMusic.ts:116`](../../server/routes/bandMusic.ts#L116) |
| `GET` | `/api/bands/{id}/preview` | Sesión | — |  | [`server/routes/bandMusic.ts:36`](../../server/routes/bandMusic.ts#L36) |
| `POST` | `/api/cron/metricas-mensual` | Sesión | — |  | [`server/routes/bandMusic.ts:205`](../../server/routes/bandMusic.ts#L205) |

### bands

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/bands` | Sesión | — |  | [`server/routes/bands.ts:95`](../../server/routes/bands.ts#L95) |
| `POST` | `/api/bands` | Sesión | — |  | [`server/routes/bands.ts:110`](../../server/routes/bands.ts#L110) |
| `POST` | `/api/bands/ai-lookup` | Sesión | — |  | [`server/routes/bands.ts:292`](../../server/routes/bands.ts#L292) |
| `POST` | `/api/bands/ai-scout` | Sesión | — |  | [`server/routes/bands.ts:231`](../../server/routes/bands.ts#L231) |
| `GET` | `/api/bands/alert-settings` | Sesión | — |  | [`server/routes/bands.ts:870`](../../server/routes/bands.ts#L870) |
| `POST` | `/api/bands/alert-settings` | Sesión | — |  | [`server/routes/bands.ts:882`](../../server/routes/bands.ts#L882) |
| `POST` | `/api/bands/analyze-tone` | Sesión | — |  | [`server/routes/bands.ts:356`](../../server/routes/bands.ts#L356) |
| `POST` | `/api/bands/bulk-delete` | Sesión | — |  | [`server/routes/bands.ts:171`](../../server/routes/bands.ts#L171) |
| `POST` | `/api/bands/email-account` | Sesión | — |  | [`server/routes/bands.ts:744`](../../server/routes/bands.ts#L744) |
| `GET` | `/api/bands/email-account/{bandId}` | Sesión | — |  | [`server/routes/bands.ts:728`](../../server/routes/bands.ts#L728) |
| `POST` | `/api/bands/generate-logo` | Sesión | iaRateLimiter |  | [`server/routes/bands.ts:986`](../../server/routes/bands.ts#L986) |
| `GET` | `/api/bands/print-settings` | Sesión | — |  | [`server/routes/bands.ts:896`](../../server/routes/bands.ts#L896) |
| `PUT` | `/api/bands/print-settings` | Sesión | — |  | [`server/routes/bands.ts:140`](../../server/routes/bands.ts#L140) |
| `POST` | `/api/bands/schedules` | Sesión | — |  | [`server/routes/bands.ts:701`](../../server/routes/bands.ts#L701) |
| `GET` | `/api/bands/schedules/{bandId}` | Sesión | — |  | [`server/routes/bands.ts:685`](../../server/routes/bands.ts#L685) |
| `POST` | `/api/bands/send-reminder` | Sesión | — |  | [`server/routes/bands.ts:782`](../../server/routes/bands.ts#L782) |
| `POST` | `/api/bands/sync` | Sesión | — |  | [`server/routes/bands.ts:208`](../../server/routes/bands.ts#L208) |
| `GET` | `/api/bands/tone-dna` | Sesión | — |  | [`server/routes/bands.ts:570`](../../server/routes/bands.ts#L570) |
| `PATCH` | `/api/bands/tone-dna` | Sesión | — |  | [`server/routes/bands.ts:581`](../../server/routes/bands.ts#L581) |
| `PATCH` | `/api/bands/tone-dna/learned-rules` | Sesión | — |  | [`server/routes/bands.ts:632`](../../server/routes/bands.ts#L632) |
| `POST` | `/api/bands/trigger-alert-digest` | Sesión | — |  | [`server/routes/bands.ts:908`](../../server/routes/bands.ts#L908) |
| `PUT` | `/api/bands/{id}` | Sesión | — |  | [`server/routes/bands.ts:151`](../../server/routes/bands.ts#L151) |
| `DELETE` | `/api/bands/{id}` | Sesión | — |  | [`server/routes/bands.ts:192`](../../server/routes/bands.ts#L192) |
| `GET` | `/api/response-strategies` | Sesión | — |  | [`server/routes/bands/responseStrategies.ts:50`](../../server/routes/bands/responseStrategies.ts#L50) |
| `POST` | `/api/response-strategies` | Sesión | — |  | [`server/routes/bands/responseStrategies.ts:74`](../../server/routes/bands/responseStrategies.ts#L74) |
| `DELETE` | `/api/response-strategies/{responseType}` | Sesión | — |  | [`server/routes/bands/responseStrategies.ts:110`](../../server/routes/bands/responseStrategies.ts#L110) |

### billing

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/billing/confirm-success` | Sesión | — |  | [`server/routes/billing.ts:473`](../../server/routes/billing.ts#L473) |
| `POST` | `/api/billing/consume-credits` | Sesión | — |  | [`server/routes/billing.ts:876`](../../server/routes/billing.ts#L876) |
| `POST` | `/api/billing/create-checkout-session` | Sesión | — |  | [`server/routes/billing.ts:543`](../../server/routes/billing.ts#L543) |
| `POST` | `/api/billing/create-portal-session` | Sesión | — |  | [`server/routes/billing.ts:655`](../../server/routes/billing.ts#L655) |
| `GET` | `/api/billing/credits-status` | Sesión | — |  | [`server/routes/billing.ts:943`](../../server/routes/billing.ts#L943) |
| `POST` | `/api/billing/webhook` | Firma o secreto | — |  | [`server/routes/billing.ts:973`](../../server/routes/billing.ts#L973) |
| `POST` | `/api/stripe/confirm-success` | Sesión | — |  | [`server/routes/billing.ts:473`](../../server/routes/billing.ts#L473) |
| `POST` | `/api/stripe/consume-credits` | Sesión | — |  | [`server/routes/billing.ts:876`](../../server/routes/billing.ts#L876) |
| `POST` | `/api/stripe/create-checkout-session` | Sesión | — |  | [`server/routes/billing.ts:543`](../../server/routes/billing.ts#L543) |
| `POST` | `/api/stripe/create-portal-session` | Sesión | — |  | [`server/routes/billing.ts:655`](../../server/routes/billing.ts#L655) |
| `GET` | `/api/stripe/credits-status` | Sesión | — |  | [`server/routes/billing.ts:943`](../../server/routes/billing.ts#L943) |
| `POST` | `/api/stripe/webhook` | Firma o secreto | — |  | [`server/routes/billing.ts:974`](../../server/routes/billing.ts#L974) |

### campaigns

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/campaigns` | Sesión | — |  | [`server/routes/campaigns.ts:20`](../../server/routes/campaigns.ts#L20) |
| `POST` | `/api/campaigns` | Sesión | — |  | [`server/routes/campaigns.ts:32`](../../server/routes/campaigns.ts#L32) |
| `POST` | `/api/campaigns/active` | Sesión | — |  | [`server/routes/campaigns.ts:87`](../../server/routes/campaigns.ts#L87) |
| `PUT` | `/api/campaigns/{id}` | Sesión | — |  | [`server/routes/campaigns.ts:55`](../../server/routes/campaigns.ts#L55) |
| `DELETE` | `/api/campaigns/{id}` | Sesión | — |  | [`server/routes/campaigns.ts:74`](../../server/routes/campaigns.ts#L74) |
| `POST` | `/api/campaigns/{id}/record-training` | Sesión | — |  | [`server/routes/campaigns.ts:111`](../../server/routes/campaigns.ts#L111) |
| `POST` | `/api/campaigns/{id}/train-tone-dna` | Sesión | — |  | [`server/routes/campaigns.ts:142`](../../server/routes/campaigns.ts#L142) |

### campanaConcierto

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/campana-concierto/redactar` | Sesión | iaRateLimiter |  | [`server/routes/campanaConcierto.ts:101`](../../server/routes/campanaConcierto.ts#L101) |

### chat

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/chat` | Sesión | — |  | [`server/routes/chat.ts:24`](../../server/routes/chat.ts#L24) |
| `POST` | `/api/write-reels-copy` | Sesión | iaRateLimiter |  | [`server/routes/chat.ts:674`](../../server/routes/chat.ts#L674) |

### concert_to_album

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/concert-to-album/analyze` | Sesión | — |  | [`server/routes/concert_to_album.ts:458`](../../server/routes/concert_to_album.ts#L458) |
| `POST` | `/api/concert-to-album/classify-tracks` | Sesión | — |  | [`server/routes/concert_to_album.ts:1366`](../../server/routes/concert_to_album.ts#L1366) |
| `GET` | `/api/concert-to-album/cookies-status` | Sesión | — |  | [`server/routes/concert_to_album.ts:233`](../../server/routes/concert_to_album.ts#L233) |
| `POST` | `/api/concert-to-album/delete-cookies` | Sesión | — |  | [`server/routes/concert_to_album.ts:272`](../../server/routes/concert_to_album.ts#L272) |
| `POST` | `/api/concert-to-album/demo-audio` | Sesión | — |  | [`server/routes/concert_to_album.ts:1554`](../../server/routes/concert_to_album.ts#L1554) |
| `POST` | `/api/concert-to-album/detect-cues` | Sesión | — |  | [`server/routes/concert_to_album.ts:1009`](../../server/routes/concert_to_album.ts#L1009) |
| `POST` | `/api/concert-to-album/preview-snippet` | Sesión | — |  | [`server/routes/concert_to_album.ts:1338`](../../server/routes/concert_to_album.ts#L1338) |
| `POST` | `/api/concert-to-album/process` | Sesión | — |  | [`server/routes/concert_to_album.ts:759`](../../server/routes/concert_to_album.ts#L759) |
| `POST` | `/api/concert-to-album/save-cookies` | Sesión | — |  | [`server/routes/concert_to_album.ts:249`](../../server/routes/concert_to_album.ts#L249) |
| `POST` | `/api/concert-to-album/transcribe-song` | Sesión | — |  | [`server/routes/concert_to_album.ts:1472`](../../server/routes/concert_to_album.ts#L1472) |
| `POST` | `/api/concert-to-album/transcribe-speech` | Sesión | — |  | [`server/routes/concert_to_album.ts:1283`](../../server/routes/concert_to_album.ts#L1283) |

### concerts

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/calendar-feed-url` | Sesión | — |  | [`server/routes/concerts.ts:406`](../../server/routes/concerts.ts#L406) |
| `GET` | `/api/calendar.ics` | Firma o secreto | — |  | [`server/routes/concerts.ts:432`](../../server/routes/concerts.ts#L432) |
| `GET` | `/api/calendar/conflicts` | Sesión | — |  | [`server/routes/concerts.ts:56`](../../server/routes/concerts.ts#L56) |
| `POST` | `/api/concerts` | Sesión | — |  | [`server/routes/concerts.ts:174`](../../server/routes/concerts.ts#L174) |
| `POST` | `/api/concerts/sync` | Sesión | — |  | [`server/routes/concerts.ts:229`](../../server/routes/concerts.ts#L229) |
| `PUT` | `/api/concerts/{id}` | Sesión | — |  | [`server/routes/concerts.ts:149`](../../server/routes/concerts.ts#L149) |
| `DELETE` | `/api/concerts/{id}` | Sesión | — |  | [`server/routes/concerts.ts:196`](../../server/routes/concerts.ts#L196) |
| `GET` | `/api/logistics` | Sesión | — |  | [`server/routes/concerts.ts:252`](../../server/routes/concerts.ts#L252) |
| `POST` | `/api/logistics/gear` | Sesión | — |  | [`server/routes/concerts.ts:302`](../../server/routes/concerts.ts#L302) |
| `POST` | `/api/logistics/runofshow` | Sesión | — |  | [`server/routes/concerts.ts:275`](../../server/routes/concerts.ts#L275) |
| `POST` | `/api/messages` | Sesión | — |  | [`server/routes/concerts.ts:396`](../../server/routes/concerts.ts#L396) |
| `GET` | `/api/payments` | Sesión + líder | — |  | [`server/routes/concerts.ts:329`](../../server/routes/concerts.ts#L329) |
| `POST` | `/api/payments` | Sesión + líder | — |  | [`server/routes/concerts.ts:341`](../../server/routes/concerts.ts#L341) |
| `POST` | `/api/payments/sync` | Sesión + líder | — |  | [`server/routes/concerts.ts:373`](../../server/routes/concerts.ts#L373) |
| `PUT` | `/api/payments/{id}` | Sesión + líder | — |  | [`server/routes/concerts.ts:354`](../../server/routes/concerts.ts#L354) |
| `POST` | `/api/rehearsals` | Sesión | — |  | [`server/routes/concerts.ts:94`](../../server/routes/concerts.ts#L94) |
| `PUT` | `/api/rehearsals/{id}` | Sesión | — |  | [`server/routes/concerts.ts:69`](../../server/routes/concerts.ts#L69) |
| `DELETE` | `/api/rehearsals/{id}` | Sesión | — |  | [`server/routes/concerts.ts:116`](../../server/routes/concerts.ts#L116) |

### deals

Acuerdos de concierto: vista pública por token y firma.

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/deals` | Sesión | — |  | [`server/routes/deals.ts:57`](../../server/routes/deals.ts#L57) |
| `POST` | `/api/deals` | Sesión | — |  | [`server/routes/deals.ts:134`](../../server/routes/deals.ts#L134) |
| `GET` | `/api/deals/lead/{leadId}` | Sesión | — |  | [`server/routes/deals.ts:113`](../../server/routes/deals.ts#L113) |
| `GET` | `/api/public/deals/{token}` | Pública | — |  | [`server/routes/deals.ts:209`](../../server/routes/deals.ts#L209) |
| `POST` | `/api/public/deals/{token}/resend-email` | Pública | reenvioEmailRateLimiter |  | [`server/routes/deals.ts:434`](../../server/routes/deals.ts#L434) |
| `POST` | `/api/public/deals/{token}/sign` | Pública | — | ★ | [`server/routes/deals.ts:288`](../../server/routes/deals.ts#L288) |

### donations

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/donations/create-checkout-session` | Sesión | donationRateLimiter |  | [`server/routes/donations.ts:80`](../../server/routes/donations.ts#L80) |
| `GET` | `/api/donations/deal-support` | Sesión | — |  | [`server/routes/donations.ts:148`](../../server/routes/donations.ts#L148) |
| `POST` | `/api/donations/deal-support/create-checkout-session` | Sesión | donationRateLimiter |  | [`server/routes/donations.ts:178`](../../server/routes/donations.ts#L178) |
| `GET` | `/api/donations/status` | Sesión | — |  | [`server/routes/donations.ts:44`](../../server/routes/donations.ts#L44) |

### enlacesCortos

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/r/{code}` | Pública | publicoRateLimiter |  | [`server/routes/enlacesCortos.ts:49`](../../server/routes/enlacesCortos.ts#L49) |
| `GET` | `/api/short-links` | Sesión | — |  | [`server/routes/enlacesCortos.ts:127`](../../server/routes/enlacesCortos.ts#L127) |
| `POST` | `/api/short-links` | Sesión | escrituraLimiter |  | [`server/routes/enlacesCortos.ts:163`](../../server/routes/enlacesCortos.ts#L163) |
| `DELETE` | `/api/short-links/{code}` | Sesión | escrituraLimiter |  | [`server/routes/enlacesCortos.ts:209`](../../server/routes/enlacesCortos.ts#L209) |
| `GET` | `/r/{code}` | Pública | publicoRateLimiter |  | [`server/routes/enlacesCortos.ts:49`](../../server/routes/enlacesCortos.ts#L49) |
| `GET` | `/short-links` | Sesión | — |  | [`server/routes/enlacesCortos.ts:127`](../../server/routes/enlacesCortos.ts#L127) |
| `POST` | `/short-links` | Sesión | escrituraLimiter |  | [`server/routes/enlacesCortos.ts:163`](../../server/routes/enlacesCortos.ts#L163) |
| `DELETE` | `/short-links/{code}` | Sesión | escrituraLimiter |  | [`server/routes/enlacesCortos.ts:209`](../../server/routes/enlacesCortos.ts#L209) |

### epk_fans

EPK público de la banda y registro de fans con consentimiento RGPD.

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/autonomy` | Sesión | — |  | [`server/routes/epk_fans.ts:53`](../../server/routes/epk_fans.ts#L53) |
| `POST` | `/api/autonomy` | Sesión | — |  | [`server/routes/epk_fans.ts:71`](../../server/routes/epk_fans.ts#L71) |
| `PUT` | `/api/autonomy` | Sesión | — |  | [`server/routes/epk_fans.ts:104`](../../server/routes/epk_fans.ts#L104) |
| `GET` | `/api/epk` | Sesión | — |  | [`server/routes/epk_fans.ts:140`](../../server/routes/epk_fans.ts#L140) |
| `PUT` | `/api/epk` | Sesión | — |  | [`server/routes/epk_fans.ts:160`](../../server/routes/epk_fans.ts#L160) |
| `GET` | `/api/epk/clicks` | Sesión | — |  | [`server/routes/epk_fans.ts:1070`](../../server/routes/epk_fans.ts#L1070) |
| `POST` | `/api/epk/traducir` | Sesión | — |  | [`server/routes/epk_fans.ts:237`](../../server/routes/epk_fans.ts#L237) |
| `GET` | `/api/fans` | Sesión | — |  | [`server/routes/epk_fans.ts:764`](../../server/routes/epk_fans.ts#L764) |
| `POST` | `/api/fans` | Sesión | — |  | [`server/routes/epk_fans.ts:783`](../../server/routes/epk_fans.ts#L783) |
| `PATCH` | `/api/fans/{id}` | Sesión | — |  | [`server/routes/epk_fans.ts:821`](../../server/routes/epk_fans.ts#L821) |
| `DELETE` | `/api/fans/{id}` | Sesión | — |  | [`server/routes/epk_fans.ts:854`](../../server/routes/epk_fans.ts#L854) |
| `GET` | `/api/musicians-waitlist` | Sesión | — |  | [`server/routes/epk_fans.ts:1185`](../../server/routes/epk_fans.ts#L1185) |
| `GET` | `/api/public/epk` | Pública | — |  | [`server/routes/epk_fans.ts:467`](../../server/routes/epk_fans.ts#L467) |
| `POST` | `/api/public/fans` | Pública | publicoRateLimiter | ★ | [`server/routes/epk_fans.ts:868`](../../server/routes/epk_fans.ts#L868) |
| `POST` | `/api/public/musicians-waitlist` | Pública | publicoRateLimiter |  | [`server/routes/epk_fans.ts:1118`](../../server/routes/epk_fans.ts#L1118) |
| `POST` | `/api/public/track-click` | Pública | publicoRateLimiter |  | [`server/routes/epk_fans.ts:979`](../../server/routes/epk_fans.ts#L979) |

### gmailOAuth

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/gmail-oauth/authorize-url` | Sesión | — |  | [`server/routes/gmailOAuth.ts:118`](../../server/routes/gmailOAuth.ts#L118) |
| `GET` | `/api/gmail-oauth/callback` | Pública | — |  | [`server/routes/gmailOAuth.ts:149`](../../server/routes/gmailOAuth.ts#L149) |
| `POST` | `/api/gmail-oauth/disconnect` | Sesión | — |  | [`server/routes/gmailOAuth.ts:273`](../../server/routes/gmailOAuth.ts#L273) |
| `GET` | `/api/gmail-oauth/status` | Sesión | — |  | [`server/routes/gmailOAuth.ts:261`](../../server/routes/gmailOAuth.ts#L261) |

### leads

Salas, festivales y contactos del CRM de booking. Los agentes (Scout, Redactor, Enviador, Lector) trabajan sobre estos registros; la aprobación es un cambio de `estado`.

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/ai/providers` | Sesión | — |  | [`server/routes/leads/crud.ts:21`](../../server/routes/leads/crud.ts#L21) |
| `POST` | `/api/batch-enrich-campaign` | Sesión | — |  | [`server/routes/leads/enrichment.ts:943`](../../server/routes/leads/enrichment.ts#L943) |
| `POST` | `/api/campaign-mass-search` | Sesión | — |  | [`server/routes/leads/places.ts:407`](../../server/routes/leads/places.ts#L407) |
| `POST` | `/api/detect-all-dates` | Sesión | — |  | [`server/routes/leads/enrichment.ts:867`](../../server/routes/leads/enrichment.ts#L867) |
| `GET` | `/api/example-threads` | Sesión | — |  | [`server/routes/leads/exampleThreads.ts:23`](../../server/routes/leads/exampleThreads.ts#L23) |
| `POST` | `/api/example-threads` | Sesión | — |  | [`server/routes/leads/exampleThreads.ts:35`](../../server/routes/leads/exampleThreads.ts#L35) |
| `PUT` | `/api/example-threads/{id}` | Sesión | — |  | [`server/routes/leads/exampleThreads.ts:66`](../../server/routes/leads/exampleThreads.ts#L66) |
| `DELETE` | `/api/example-threads/{id}` | Sesión | — |  | [`server/routes/leads/exampleThreads.ts:90`](../../server/routes/leads/exampleThreads.ts#L90) |
| `POST` | `/api/extract-emails` | Sesión | — |  | [`server/routes/leads/places.ts:823`](../../server/routes/leads/places.ts#L823) |
| `POST` | `/api/generate-simulated-email` | Sesión | — |  | [`server/routes/leads/simulation.ts:10`](../../server/routes/leads/simulation.ts#L10) |
| `POST` | `/api/import-excel` | Sesión | — |  | [`server/routes/leads/import.ts:12`](../../server/routes/leads/import.ts#L12) |
| `POST` | `/api/import-places` | Sesión | — |  | [`server/routes/leads/places.ts:953`](../../server/routes/leads/places.ts#L953) |
| `GET` | `/api/leads` | Sesión | — | ★ | [`server/routes/leads/crud.ts:37`](../../server/routes/leads/crud.ts#L37) |
| `POST` | `/api/leads` | Sesión | — | ★ | [`server/routes/leads/crud.ts:198`](../../server/routes/leads/crud.ts#L198) |
| `POST` | `/api/leads/ai-lookup` | Sesión | — |  | [`server/routes/leads/enrichment.ts:216`](../../server/routes/leads/enrichment.ts#L216) |
| `POST` | `/api/leads/audit-pitch` | Sesión | — |  | [`server/routes/leads/pitch.ts:20`](../../server/routes/leads/pitch.ts#L20) |
| `POST` | `/api/leads/batch-enrich-campaign` | Sesión | — |  | [`server/routes/leads/enrichment.ts:943`](../../server/routes/leads/enrichment.ts#L943) |
| `POST` | `/api/leads/bulk-delete` | Sesión | — |  | [`server/routes/leads/crud.ts:334`](../../server/routes/leads/crud.ts#L334) |
| `POST` | `/api/leads/campaign-mass-search` | Sesión | — |  | [`server/routes/leads/places.ts:407`](../../server/routes/leads/places.ts#L407) |
| `POST` | `/api/leads/detect-all-dates` | Sesión | — |  | [`server/routes/leads/enrichment.ts:867`](../../server/routes/leads/enrichment.ts#L867) |
| `POST` | `/api/leads/enrich-addresses` | Sesión | — |  | [`server/routes/leads/enrichment.ts:612`](../../server/routes/leads/enrichment.ts#L612) |
| `POST` | `/api/leads/enrich-all-band` | Sesión | — |  | [`server/routes/leads/enrichment.ts:447`](../../server/routes/leads/enrichment.ts#L447) |
| `POST` | `/api/leads/enrich-lead` | Sesión | — |  | [`server/routes/leads/enrichment.ts:392`](../../server/routes/leads/enrichment.ts#L392) |
| `POST` | `/api/leads/extract-emails` | Sesión | — |  | [`server/routes/leads/places.ts:823`](../../server/routes/leads/places.ts#L823) |
| `POST` | `/api/leads/import-places` | Sesión | — |  | [`server/routes/leads/places.ts:953`](../../server/routes/leads/places.ts#L953) |
| `POST` | `/api/leads/multi-source-venues` | Sesión | — |  | [`server/routes/leads/places.ts:1106`](../../server/routes/leads/places.ts#L1106) |
| `POST` | `/api/leads/places-search` | Sesión | — |  | [`server/routes/leads/places.ts:35`](../../server/routes/leads/places.ts#L35) |
| `POST` | `/api/leads/public-cultural-radar` | Sesión | — |  | [`server/routes/leads/places.ts:1168`](../../server/routes/leads/places.ts#L1168) |
| `POST` | `/api/leads/realign-headers` | Sesión | — |  | [`server/routes/leads/crud.ts:32`](../../server/routes/leads/crud.ts#L32) |
| `POST` | `/api/leads/similar-artists-venues` | Sesión | — |  | [`server/routes/leads/places.ts:1130`](../../server/routes/leads/places.ts#L1130) |
| `POST` | `/api/leads/train-tone-dna` | Sesión | — |  | [`server/routes/leads/pitch.ts:162`](../../server/routes/leads/pitch.ts#L162) |
| `GET` | `/api/leads/{id}` | Sesión | — | ★ | [`server/routes/leads/crud.ts:97`](../../server/routes/leads/crud.ts#L97) |
| `PUT` | `/api/leads/{id}` | Sesión | — | ★ | [`server/routes/leads/crud.ts:130`](../../server/routes/leads/crud.ts#L130) |
| `DELETE` | `/api/leads/{id}` | Sesión | — |  | [`server/routes/leads/crud.ts:359`](../../server/routes/leads/crud.ts#L359) |
| `POST` | `/api/leads/{id}/analyze-sentiment` | Sesión | — |  | [`server/routes/leads/reply.ts:73`](../../server/routes/leads/reply.ts#L73) |
| `POST` | `/api/leads/{id}/calculate-break-even` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1497`](../../server/routes/leads/enrichment.ts#L1497) |
| `POST` | `/api/leads/{id}/detect-dates` | Sesión | — |  | [`server/routes/leads/enrichment.ts:817`](../../server/routes/leads/enrichment.ts#L817) |
| `POST` | `/api/leads/{id}/enrich-all-apis` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1251`](../../server/routes/leads/enrichment.ts#L1251) |
| `POST` | `/api/leads/{id}/enrich-booking-window` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1550`](../../server/routes/leads/enrichment.ts#L1550) |
| `POST` | `/api/leads/{id}/enrich-co-booking` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1627`](../../server/routes/leads/enrichment.ts#L1627) |
| `POST` | `/api/leads/{id}/enrich-google-places` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1137`](../../server/routes/leads/enrichment.ts#L1137) |
| `POST` | `/api/leads/{id}/enrich-instagram` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1043`](../../server/routes/leads/enrichment.ts#L1043) |
| `POST` | `/api/leads/{id}/enrich-jina` | Sesión | — |  | [`server/routes/leads/enrichment.ts:755`](../../server/routes/leads/enrichment.ts#L755) |
| `POST` | `/api/leads/{id}/enrich-local-events` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1573`](../../server/routes/leads/enrichment.ts#L1573) |
| `POST` | `/api/leads/{id}/enrich-logistics` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1432`](../../server/routes/leads/enrichment.ts#L1432) |
| `POST` | `/api/leads/{id}/enrich-press-media` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1600`](../../server/routes/leads/enrichment.ts#L1600) |
| `POST` | `/api/leads/{id}/enrich-setlist` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1176`](../../server/routes/leads/enrichment.ts#L1176) |
| `POST` | `/api/leads/{id}/enrich-social` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1467`](../../server/routes/leads/enrichment.ts#L1467) |
| `POST` | `/api/leads/{id}/enrich-spotify` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1094`](../../server/routes/leads/enrichment.ts#L1094) |
| `POST` | `/api/leads/{id}/generate-multi-pitch` | Sesión | — |  | [`server/routes/leads/pitch.ts:38`](../../server/routes/leads/pitch.ts#L38) |
| `POST` | `/api/leads/{id}/generate-reply` | Sesión | — |  | [`server/routes/leads/reply.ts:18`](../../server/routes/leads/reply.ts#L18) |
| `GET` | `/api/leads/{id}/messages` | Sesión | — |  | [`server/routes/leads/crud.ts:117`](../../server/routes/leads/crud.ts#L117) |
| `POST` | `/api/leads/{id}/regenerate-pitch` | Sesión | — |  | [`server/routes/leads/pitch.ts:68`](../../server/routes/leads/pitch.ts#L68) |
| `POST` | `/api/leads/{id}/regenerate-reply` | Sesión | — |  | [`server/routes/leads/reply.ts:152`](../../server/routes/leads/reply.ts#L152) |
| `POST` | `/api/leads/{id}/revert-pitch` | Sesión | — |  | [`server/routes/leads/pitch.ts:102`](../../server/routes/leads/pitch.ts#L102) |
| `POST` | `/api/leads/{id}/verify-email` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1213`](../../server/routes/leads/enrichment.ts#L1213) |
| `POST` | `/api/multi-source-venues` | Sesión | — |  | [`server/routes/leads/places.ts:1106`](../../server/routes/leads/places.ts#L1106) |
| `POST` | `/api/places-search` | Sesión | — |  | [`server/routes/leads/places.ts:35`](../../server/routes/leads/places.ts#L35) |
| `POST` | `/api/public-cultural-radar` | Sesión | — |  | [`server/routes/leads/places.ts:1168`](../../server/routes/leads/places.ts#L1168) |
| `POST` | `/api/scrape-contact` | Sesión | — |  | [`server/routes/leads/enrichment.ts:499`](../../server/routes/leads/enrichment.ts#L499) |
| `POST` | `/api/similar-artists-venues` | Sesión | — |  | [`server/routes/leads/places.ts:1130`](../../server/routes/leads/places.ts#L1130) |
| `GET` | `/api/templates` | Sesión | — |  | [`server/routes/leads/templates.ts:55`](../../server/routes/leads/templates.ts#L55) |
| `POST` | `/api/templates/generate-all` | Sesión | — |  | [`server/routes/leads/templates.ts:343`](../../server/routes/leads/templates.ts#L343) |
| `POST` | `/api/templates/optimize` | Sesión | — |  | [`server/routes/leads/templates.ts:247`](../../server/routes/leads/templates.ts#L247) |
| `POST` | `/api/templates/preview` | Sesión | — |  | [`server/routes/leads/templates.ts:144`](../../server/routes/leads/templates.ts#L144) |
| `POST` | `/api/templates/reset` | Sesión | — |  | [`server/routes/leads/templates.ts:645`](../../server/routes/leads/templates.ts#L645) |
| `POST` | `/api/templates/save` | Sesión | — |  | [`server/routes/leads/templates.ts:71`](../../server/routes/leads/templates.ts#L71) |
| `GET` | `/api/templates/stats` | Sesión | — |  | [`server/routes/leads/templates.ts:505`](../../server/routes/leads/templates.ts#L505) |
| `GET` | `/api/validate-emails` | Sesión | — |  | [`server/routes/leads/emailValidation.ts:14`](../../server/routes/leads/emailValidation.ts#L14) |
| `POST` | `/api/{id}/calculate-break-even` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1497`](../../server/routes/leads/enrichment.ts#L1497) |
| `POST` | `/api/{id}/detect-dates` | Sesión | — |  | [`server/routes/leads/enrichment.ts:817`](../../server/routes/leads/enrichment.ts#L817) |
| `POST` | `/api/{id}/enrich-all-apis` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1251`](../../server/routes/leads/enrichment.ts#L1251) |
| `POST` | `/api/{id}/enrich-booking-window` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1550`](../../server/routes/leads/enrichment.ts#L1550) |
| `POST` | `/api/{id}/enrich-co-booking` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1627`](../../server/routes/leads/enrichment.ts#L1627) |
| `POST` | `/api/{id}/enrich-google-places` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1137`](../../server/routes/leads/enrichment.ts#L1137) |
| `POST` | `/api/{id}/enrich-instagram` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1043`](../../server/routes/leads/enrichment.ts#L1043) |
| `POST` | `/api/{id}/enrich-jina` | Sesión | — |  | [`server/routes/leads/enrichment.ts:755`](../../server/routes/leads/enrichment.ts#L755) |
| `POST` | `/api/{id}/enrich-local-events` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1573`](../../server/routes/leads/enrichment.ts#L1573) |
| `POST` | `/api/{id}/enrich-logistics` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1432`](../../server/routes/leads/enrichment.ts#L1432) |
| `POST` | `/api/{id}/enrich-press-media` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1600`](../../server/routes/leads/enrichment.ts#L1600) |
| `POST` | `/api/{id}/enrich-setlist` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1176`](../../server/routes/leads/enrichment.ts#L1176) |
| `POST` | `/api/{id}/enrich-social` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1467`](../../server/routes/leads/enrichment.ts#L1467) |
| `POST` | `/api/{id}/enrich-spotify` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1094`](../../server/routes/leads/enrichment.ts#L1094) |
| `POST` | `/api/{id}/verify-email` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1213`](../../server/routes/leads/enrichment.ts#L1213) |

### metrics

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/generate-growth-plan` | Sesión | — |  | [`server/routes/metrics.ts:720`](../../server/routes/metrics.ts#L720) |
| `GET` | `/api/metrics` | Sesión | — |  | [`server/routes/metrics.ts:14`](../../server/routes/metrics.ts#L14) |
| `POST` | `/api/metrics` | Sesión | — |  | [`server/routes/metrics.ts:26`](../../server/routes/metrics.ts#L26) |
| `GET` | `/api/metrics/content-items` | Sesión | — |  | [`server/routes/metrics.ts:223`](../../server/routes/metrics.ts#L223) |
| `POST` | `/api/metrics/instagram/connect` | Sesión | — |  | [`server/routes/metrics.ts:453`](../../server/routes/metrics.ts#L453) |
| `POST` | `/api/metrics/instagram/disconnect` | Sesión | — |  | [`server/routes/metrics.ts:569`](../../server/routes/metrics.ts#L569) |
| `GET` | `/api/metrics/instagram/status` | Sesión | — |  | [`server/routes/metrics.ts:355`](../../server/routes/metrics.ts#L355) |
| `POST` | `/api/metrics/real` | Sesión | — |  | [`server/routes/metrics.ts:103`](../../server/routes/metrics.ts#L103) |
| `POST` | `/api/metrics/scan-screenshot` | Sesión | — |  | [`server/routes/metrics.ts:595`](../../server/routes/metrics.ts#L595) |
| `POST` | `/api/metrics/sync` | Sesión | — |  | [`server/routes/metrics.ts:78`](../../server/routes/metrics.ts#L78) |
| `PUT` | `/api/metrics/{id}` | Sesión | — |  | [`server/routes/metrics.ts:39`](../../server/routes/metrics.ts#L39) |
| `DELETE` | `/api/metrics/{id}` | Sesión + líder | — |  | [`server/routes/metrics.ts:58`](../../server/routes/metrics.ts#L58) |

### paginaConcierto

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/e/{slug}` | Pública | publicoRateLimiter |  | [`server/routes/paginaConcierto.ts:39`](../../server/routes/paginaConcierto.ts#L39) |
| `GET` | `/robots.txt` | Pública | — |  | [`server/routes/paginaConcierto.ts:150`](../../server/routes/paginaConcierto.ts#L150) |
| `GET` | `/sitemap.xml` | Pública | publicoRateLimiter |  | [`server/routes/paginaConcierto.ts:132`](../../server/routes/paginaConcierto.ts#L132) |

### posts

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/posts` | Sesión | — |  | [`server/routes/posts.ts:20`](../../server/routes/posts.ts#L20) |
| `POST` | `/api/posts` | Sesión | — |  | [`server/routes/posts.ts:84`](../../server/routes/posts.ts#L84) |
| `POST` | `/api/posts/sync` | Sesión | — |  | [`server/routes/posts.ts:207`](../../server/routes/posts.ts#L207) |
| `POST` | `/api/posts/trigger-webhook` | Sesión | — |  | [`server/routes/posts.ts:230`](../../server/routes/posts.ts#L230) |
| `PUT` | `/api/posts/{id}` | Sesión | — |  | [`server/routes/posts.ts:32`](../../server/routes/posts.ts#L32) |
| `DELETE` | `/api/posts/{id}` | Sesión | — |  | [`server/routes/posts.ts:102`](../../server/routes/posts.ts#L102) |
| `GET` | `/api/social/accounts` | Sesión | — |  | [`server/routes/posts.ts:122`](../../server/routes/posts.ts#L122) |
| `POST` | `/api/social/accounts/connect` | Sesión | — |  | [`server/routes/posts.ts:134`](../../server/routes/posts.ts#L134) |
| `DELETE` | `/api/social/accounts/{id}` | Sesión | — |  | [`server/routes/posts.ts:165`](../../server/routes/posts.ts#L165) |
| `POST` | `/api/social/publish-now/{id}` | Sesión | — |  | [`server/routes/posts.ts:178`](../../server/routes/posts.ts#L178) |
| `POST` | `/api/social/run-scheduled-publisher` | Sesión | — |  | [`server/routes/posts.ts:195`](../../server/routes/posts.ts#L195) |

### reels

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/analyze-video-highlights` | Sesión | iaRateLimiter |  | [`server/routes/reels.ts:475`](../../server/routes/reels.ts#L475) |
| `POST` | `/api/api/reels/ai-hook-doctor` | Sesión | iaRateLimiter |  | [`server/routes/reels.ts:1161`](../../server/routes/reels.ts#L1161) |
| `POST` | `/api/cut-video-clip` | Sesión | renderRateLimiter, renderConcurrencyLimiter |  | [`server/routes/reels.ts:798`](../../server/routes/reels.ts#L798) |
| `POST` | `/api/reanalyze-clip` | Sesión | iaRateLimiter |  | [`server/routes/reels.ts:986`](../../server/routes/reels.ts#L986) |
| `GET` | `/api/reel-analysis` | Sesión | — |  | [`server/routes/reels.ts:438`](../../server/routes/reels.ts#L438) |
| `POST` | `/api/reels/ai-hook-doctor` | Sesión | iaRateLimiter |  | [`server/routes/reels.ts:1161`](../../server/routes/reels.ts#L1161) |
| `GET` | `/api/youtube-meta` | Sesión | — |  | [`server/routes/reels.ts:400`](../../server/routes/reels.ts#L400) |

### referidos

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/public/insignia` | Pública | publicoRateLimiter |  | [`server/routes/referidos.ts:76`](../../server/routes/referidos.ts#L76) |
| `GET` | `/api/referidos` | Sesión | — |  | [`server/routes/referidos.ts:31`](../../server/routes/referidos.ts#L31) |
| `POST` | `/api/referidos/atribuir` | Sesión | — |  | [`server/routes/referidos.ts:47`](../../server/routes/referidos.ts#L47) |

### repertorio

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/ai-composer-arrangement` | Sesión | — |  | [`server/routes/repertorio.ts:733`](../../server/routes/repertorio.ts#L733) |
| `POST` | `/api/enrich-missing-audio` | Sesión | — |  | [`server/routes/repertorio.ts:950`](../../server/routes/repertorio.ts#L950) |
| `POST` | `/api/generate-song-chords` | Sesión | — |  | [`server/routes/repertorio.ts:538`](../../server/routes/repertorio.ts#L538) |
| `PUT` | `/api/letras/auto` | Sesión | — |  | [`server/routes/repertorio.ts:300`](../../server/routes/repertorio.ts#L300) |
| `GET` | `/api/letras/cola` | Sesión | — |  | [`server/routes/repertorio.ts:275`](../../server/routes/repertorio.ts#L275) |
| `POST` | `/api/letras/cola` | Sesión | — |  | [`server/routes/repertorio.ts:283`](../../server/routes/repertorio.ts#L283) |
| `DELETE` | `/api/letras/cola` | Sesión | — |  | [`server/routes/repertorio.ts:292`](../../server/routes/repertorio.ts#L292) |
| `POST` | `/api/optimize-wavs` | Sesión | — |  | [`server/routes/repertorio.ts:937`](../../server/routes/repertorio.ts#L937) |
| `GET` | `/api/setlist-shortcuts` | Sesión | — |  | [`server/routes/repertorio.ts:494`](../../server/routes/repertorio.ts#L494) |
| `POST` | `/api/setlist-shortcuts` | Sesión | — |  | [`server/routes/repertorio.ts:506`](../../server/routes/repertorio.ts#L506) |
| `DELETE` | `/api/setlist-shortcuts/{id}` | Sesión | — |  | [`server/routes/repertorio.ts:525`](../../server/routes/repertorio.ts#L525) |
| `GET` | `/api/setlists` | Sesión | — |  | [`server/routes/repertorio.ts:426`](../../server/routes/repertorio.ts#L426) |
| `POST` | `/api/setlists` | Sesión | — |  | [`server/routes/repertorio.ts:438`](../../server/routes/repertorio.ts#L438) |
| `POST` | `/api/setlists/import-from-image` | Sesión | iaRateLimiter |  | [`server/routes/repertorio.ts:901`](../../server/routes/repertorio.ts#L901) |
| `PUT` | `/api/setlists/{id}` | Sesión | — |  | [`server/routes/repertorio.ts:463`](../../server/routes/repertorio.ts#L463) |
| `DELETE` | `/api/setlists/{id}` | Sesión | — |  | [`server/routes/repertorio.ts:480`](../../server/routes/repertorio.ts#L480) |
| `POST` | `/api/setlists/{setlistId}/analyze-with-ai` | Sesión | — |  | [`server/routes/repertorio.ts:794`](../../server/routes/repertorio.ts#L794) |
| `POST` | `/api/setlists/{setlistId}/generate-perfect-setlist` | Sesión | iaRateLimiter |  | [`server/routes/repertorio.ts:849`](../../server/routes/repertorio.ts#L849) |
| `GET` | `/api/songs` | Sesión | — |  | [`server/routes/repertorio.ts:128`](../../server/routes/repertorio.ts#L128) |
| `POST` | `/api/songs` | Sesión | — |  | [`server/routes/repertorio.ts:142`](../../server/routes/repertorio.ts#L142) |
| `PUT` | `/api/songs/{id}` | Sesión | — |  | [`server/routes/repertorio.ts:164`](../../server/routes/repertorio.ts#L164) |
| `DELETE` | `/api/songs/{id}` | Sesión | — |  | [`server/routes/repertorio.ts:412`](../../server/routes/repertorio.ts#L412) |
| `PATCH` | `/api/songs/{id}/acordes` | Sesión | — |  | [`server/routes/repertorio.ts:313`](../../server/routes/repertorio.ts#L313) |
| `POST` | `/api/songs/{id}/analizar-acordes` | Sesión | — |  | [`server/routes/repertorio.ts:232`](../../server/routes/repertorio.ts#L232) |
| `POST` | `/api/songs/{id}/analizar-dinamica` | Sesión | — |  | [`server/routes/repertorio.ts:184`](../../server/routes/repertorio.ts#L184) |
| `PATCH` | `/api/songs/{id}/energia` | Sesión | — |  | [`server/routes/repertorio.ts:395`](../../server/routes/repertorio.ts#L395) |
| `POST` | `/api/songs/{id}/letra-sincronizada` | Sesión | — |  | [`server/routes/repertorio.ts:265`](../../server/routes/repertorio.ts#L265) |
| `POST` | `/api/songs/{id}/profesor-armonia` | Sesión | — |  | [`server/routes/repertorio.ts:339`](../../server/routes/repertorio.ts#L339) |
| `GET` | `/api/songs/{id}/progreso-oido` | Sesión | — |  | [`server/routes/repertorio.ts:258`](../../server/routes/repertorio.ts#L258) |

### sistema

Salud del servicio, estado de la sesión y páginas legales servidas por server.ts.

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/download-excel` | Sesión (comprobada en el handler) | — |  | [`server.ts:254`](../../server.ts#L254) |
| `GET` | `/api/health` | Pública | — | ★ | [`server.ts:165`](../../server.ts#L165) |
| `GET` | `/api/state` | Sesión (comprobada en el handler) | — |  | [`server.ts:495`](../../server.ts#L495) |
| `GET` | `/health` | Pública | — |  | [`server.ts:165`](../../server.ts#L165) |
| `GET` | `/privacy` | Pública | — |  | [`server.ts:179`](../../server.ts#L179) |
| `GET` | `/terms` | Pública | — |  | [`server.ts:221`](../../server.ts#L221) |

### songs

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/songs/{songId}/upload-structure` | Sesión | — |  | [`server/routes/songs/structureUpload.ts:160`](../../server/routes/songs/structureUpload.ts#L160) |

### spotify

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/spotify/artist-discography` | Sesión | — |  | [`server/routes/spotify.ts:69`](../../server/routes/spotify.ts#L69) |
| `POST` | `/api/spotify/import-discography` | Sesión | — |  | [`server/routes/spotify.ts:88`](../../server/routes/spotify.ts#L88) |
| `GET` | `/api/spotify/preview` | Sesión | — |  | [`server/routes/spotify.ts:32`](../../server/routes/spotify.ts#L32) |
| `GET` | `/api/spotify/search` | Sesión | — |  | [`server/routes/spotify.ts:50`](../../server/routes/spotify.ts#L50) |
| `GET` | `/api/spotify/status` | Pública | — |  | [`server/routes/spotify.ts:19`](../../server/routes/spotify.ts#L19) |

### tours

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/tours` | Sesión | — |  | [`server/routes/tours.ts:9`](../../server/routes/tours.ts#L9) |
| `POST` | `/api/tours` | Sesión | — |  | [`server/routes/tours.ts:10`](../../server/routes/tours.ts#L10) |
| `PUT` | `/api/tours/{id}` | Sesión | — |  | [`server/routes/tours.ts:11`](../../server/routes/tours.ts#L11) |
| `DELETE` | `/api/tours/{id}` | Sesión | — |  | [`server/routes/tours.ts:12`](../../server/routes/tours.ts#L12) |

### tracking

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/api/tracking/click` | Pública | — |  | [`server/routes/tracking.ts:144`](../../server/routes/tracking.ts#L144) |
| `POST` | `/api/api/tracking/interaction` | Pública | — |  | [`server/routes/tracking.ts:255`](../../server/routes/tracking.ts#L255) |
| `GET` | `/api/api/tracking/open` | Pública | — |  | [`server/routes/tracking.ts:51`](../../server/routes/tracking.ts#L51) |
| `GET` | `/api/api/tracking/pdf` | Pública | — |  | [`server/routes/tracking.ts:323`](../../server/routes/tracking.ts#L323) |
| `GET` | `/api/tracking/click` | Pública | — |  | [`server/routes/tracking.ts:144`](../../server/routes/tracking.ts#L144) |
| `POST` | `/api/tracking/interaction` | Pública | — |  | [`server/routes/tracking.ts:255`](../../server/routes/tracking.ts#L255) |
| `GET` | `/api/tracking/open` | Pública | — |  | [`server/routes/tracking.ts:51`](../../server/routes/tracking.ts#L51) |
| `GET` | `/api/tracking/pdf` | Pública | — |  | [`server/routes/tracking.ts:323`](../../server/routes/tracking.ts#L323) |
| `POST` | `/api/webhooks/resend` | Firma o secreto | publicoRateLimiter |  | [`server/routes/tracking.ts:458`](../../server/routes/tracking.ts#L458) |

### transposeRoute

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/transpose-audio` | Sesión | — |  | [`server/routes/transposeRoute.ts:10`](../../server/routes/transposeRoute.ts#L10) |
| `POST` | `/transpose-audio` | Sesión | — |  | [`server/routes/transposeRoute.ts:10`](../../server/routes/transposeRoute.ts#L10) |

### upload

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/upload` | Sesión | — |  | [`server/routes/upload.ts:504`](../../server/routes/upload.ts#L504) |
| `POST` | `/api/upload/chunk` | Sesión | — |  | [`server/routes/upload.ts:641`](../../server/routes/upload.ts#L641) |
| `POST` | `/api/upload/cleanup-unused-media` | Sesión | — |  | [`server/routes/upload.ts:434`](../../server/routes/upload.ts#L434) |
| `GET` | `/api/upload/storage-stats` | Sesión | — |  | [`server/routes/upload.ts:406`](../../server/routes/upload.ts#L406) |
| `GET` | `/api/upload/test-supabase` | Sesión | — |  | [`server/routes/upload.ts:335`](../../server/routes/upload.ts#L335) |

### users

Autenticación (login, registro, Google, invitaciones, cambio de banda) y gestión de usuarios.

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/auth/activate-member` | Sesión opcional | loginRateLimiter |  | [`server/routes/users.ts:863`](../../server/routes/users.ts#L863) |
| `POST` | `/api/auth/check-invitation` | Pública | loginRateLimiter |  | [`server/routes/users.ts:807`](../../server/routes/users.ts#L807) |
| `POST` | `/api/auth/google` | Sesión (comprobada en el handler) | loginRateLimiter |  | [`server/routes/users.ts:977`](../../server/routes/users.ts#L977) |
| `POST` | `/api/auth/login` | Sesión (comprobada en el handler) | loginRateLimiter | ★ | [`server/routes/users.ts:1351`](../../server/routes/users.ts#L1351) |
| `POST` | `/api/auth/logout` | Sesión opcional | — |  | [`server/routes/users.ts:2241`](../../server/routes/users.ts#L2241) |
| `GET` | `/api/auth/me` | Sesión (comprobada en el handler) | — |  | [`server/routes/users.ts:1887`](../../server/routes/users.ts#L1887) |
| `POST` | `/api/auth/register` | Sesión opcional | registroRateLimiter |  | [`server/routes/users.ts:505`](../../server/routes/users.ts#L505) |
| `POST` | `/api/auth/reset-password/confirm` | Firma o secreto | loginRateLimiter |  | [`server/routes/users.ts:1720`](../../server/routes/users.ts#L1720) |
| `POST` | `/api/auth/reset-password/request` | Pública | loginRateLimiter |  | [`server/routes/users.ts:1533`](../../server/routes/users.ts#L1533) |
| `POST` | `/api/auth/switch-band` | Sesión (comprobada en el handler) | — |  | [`server/routes/users.ts:2031`](../../server/routes/users.ts#L2031) |
| `POST` | `/api/auth/test-email` | Sesión | — |  | [`server/routes/users.ts:1843`](../../server/routes/users.ts#L1843) |
| `POST` | `/api/bands/logo` | Sesión | — |  | [`server/routes/users.ts:2528`](../../server/routes/users.ts#L2528) |
| `POST` | `/api/bands/upload-logo` | Sesión | — |  | [`server/routes/users.ts:2528`](../../server/routes/users.ts#L2528) |
| `POST` | `/api/create-band` | Sesión | — |  | [`server/routes/users.ts:2614`](../../server/routes/users.ts#L2614) |
| `DELETE` | `/api/leave-band/{bandId}` | Sesión | — |  | [`server/routes/users.ts:2821`](../../server/routes/users.ts#L2821) |
| `GET` | `/api/registered-bands` | Sesión | — |  | [`server/routes/users.ts:801`](../../server/routes/users.ts#L801) |
| `POST` | `/api/set-band-order` | Sesión | — |  | [`server/routes/users.ts:2369`](../../server/routes/users.ts#L2369) |
| `POST` | `/api/set-main-band` | Sesión | — |  | [`server/routes/users.ts:2256`](../../server/routes/users.ts#L2256) |
| `GET` | `/api/ui-preferences` | Sesión | — |  | [`server/routes/users.ts:2496`](../../server/routes/users.ts#L2496) |
| `POST` | `/api/ui-preferences` | Sesión | — |  | [`server/routes/users.ts:2424`](../../server/routes/users.ts#L2424) |
| `POST` | `/api/upload-logo` | Sesión | — |  | [`server/routes/users.ts:2528`](../../server/routes/users.ts#L2528) |
| `GET` | `/api/users` | Sesión | — |  | [`server/routes/users.ts:3183`](../../server/routes/users.ts#L3183) |
| `POST` | `/api/users` | Sesión + líder | — |  | [`server/routes/users.ts:3226`](../../server/routes/users.ts#L3226) |
| `POST` | `/api/users/associate` | Sesión + líder | — |  | [`server/routes/users.ts:3098`](../../server/routes/users.ts#L3098) |
| `POST` | `/api/users/create-band` | Sesión | — |  | [`server/routes/users.ts:2614`](../../server/routes/users.ts#L2614) |
| `DELETE` | `/api/users/leave-band/{bandId}` | Sesión | — |  | [`server/routes/users.ts:2821`](../../server/routes/users.ts#L2821) |
| `GET` | `/api/users/registered-bands` | Sesión | — |  | [`server/routes/users.ts:802`](../../server/routes/users.ts#L802) |
| `POST` | `/api/users/set-band-order` | Sesión | — |  | [`server/routes/users.ts:2369`](../../server/routes/users.ts#L2369) |
| `POST` | `/api/users/set-main-band` | Sesión | — |  | [`server/routes/users.ts:2256`](../../server/routes/users.ts#L2256) |
| `GET` | `/api/users/ui-preferences` | Sesión | — |  | [`server/routes/users.ts:2496`](../../server/routes/users.ts#L2496) |
| `POST` | `/api/users/ui-preferences` | Sesión | — |  | [`server/routes/users.ts:2424`](../../server/routes/users.ts#L2424) |
| `POST` | `/api/users/upload-logo` | Sesión | — |  | [`server/routes/users.ts:2528`](../../server/routes/users.ts#L2528) |
| `PUT` | `/api/users/{id}` | Sesión | — |  | [`server/routes/users.ts:3408`](../../server/routes/users.ts#L3408) |
| `DELETE` | `/api/users/{id}` | Sesión + líder | — |  | [`server/routes/users.ts:3621`](../../server/routes/users.ts#L3621) |

## Avisos del análisis estático

Declaradas dos veces (Express usa la primera; la segunda es código muerto):

- POST /api/users/upload-logo (server/routes/users.ts:2528 y server/routes/users.ts:3032)
- POST /api/templates/preview (server/routes/leads/templates.ts:144 y server/routes/leads/templates.ts:449)

- Sin rutas sombreadas.

Omitidas a propósito:

- GET /* (server.ts:579): fallback de la SPA, no es API

