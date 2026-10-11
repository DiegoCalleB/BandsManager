# Referencia de la API

> Generado automáticamente por `scripts/generate-openapi.mjs` a partir del código. No se edita a mano: ejecuta `npm run docs:api`.

**357 rutas HTTP** (306 declaraciones de handler; el resto son alias) en 31 dominios. Contrato máquina-legible: [`openapi.json`](./openapi.json) (OpenAPI 3.1). Visor interactivo: [`index.html`](./index.html) (hay que abrirlo en un navegador; GitHub no lo renderiza). Decisión de diseño: [ADR 0012](../adr/0012-contrato-api-openapi-por-ast.md).

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
| Pública | 29 |

## Rutas sin sesión de middleware

Son las que un revisor de seguridad querrá mirar primero.

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/api/tracking/click` | Pública | — |  | [`server/routes/tracking.ts:144`](../../server/routes/tracking.ts#L144) |
| `POST` | `/api/api/tracking/interaction` | Pública | — |  | [`server/routes/tracking.ts:255`](../../server/routes/tracking.ts#L255) |
| `GET` | `/api/api/tracking/open` | Pública | — |  | [`server/routes/tracking.ts:51`](../../server/routes/tracking.ts#L51) |
| `GET` | `/api/api/tracking/pdf` | Pública | — |  | [`server/routes/tracking.ts:323`](../../server/routes/tracking.ts#L323) |
| `POST` | `/api/api/webhooks/replicate-stems` | Firma o secreto | — |  | [`server/routes/ai_music/rutasWebhooks.ts:14`](../../server/routes/ai_music/rutasWebhooks.ts#L14) |
| `POST` | `/api/auth/activate-member` | Sesión opcional | loginRateLimiter |  | [`server/routes/users/rutasInvitacion.ts:73`](../../server/routes/users/rutasInvitacion.ts#L73) |
| `POST` | `/api/auth/check-invitation` | Pública | loginRateLimiter |  | [`server/routes/users/rutasInvitacion.ts:17`](../../server/routes/users/rutasInvitacion.ts#L17) |
| `POST` | `/api/auth/google` | Sesión (comprobada en el handler) | loginRateLimiter |  | [`server/routes/users/rutasGoogle.ts:17`](../../server/routes/users/rutasGoogle.ts#L17) |
| `POST` | `/api/auth/login` | Sesión (comprobada en el handler) | loginRateLimiter | ★ | [`server/routes/users/rutasLogin.ts:15`](../../server/routes/users/rutasLogin.ts#L15) |
| `POST` | `/api/auth/logout` | Sesión opcional | — |  | [`server/routes/users/rutasSesion.ts:340`](../../server/routes/users/rutasSesion.ts#L340) |
| `GET` | `/api/auth/me` | Sesión (comprobada en el handler) | — |  | [`server/routes/users/rutasSesion.ts:13`](../../server/routes/users/rutasSesion.ts#L13) |
| `POST` | `/api/auth/register` | Sesión opcional | registroRateLimiter |  | [`server/routes/users/rutasRegistro.ts:17`](../../server/routes/users/rutasRegistro.ts#L17) |
| `POST` | `/api/auth/reset-password/confirm` | Firma o secreto | loginRateLimiter |  | [`server/routes/users/rutasRecuperacion.ts:203`](../../server/routes/users/rutasRecuperacion.ts#L203) |
| `POST` | `/api/auth/reset-password/request` | Pública | loginRateLimiter |  | [`server/routes/users/rutasRecuperacion.ts:16`](../../server/routes/users/rutasRecuperacion.ts#L16) |
| `POST` | `/api/auth/switch-band` | Sesión (comprobada en el handler) | — |  | [`server/routes/users/rutasSesion.ts:135`](../../server/routes/users/rutasSesion.ts#L135) |
| `POST` | `/api/billing/webhook` | Firma o secreto | — |  | [`server/routes/billing.ts:971`](../../server/routes/billing.ts#L971) |
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
| `POST` | `/api/public/musicians-waitlist` | Pública | publicoRateLimiter |  | [`server/routes/epk_fans.ts:1112`](../../server/routes/epk_fans.ts#L1112) |
| `POST` | `/api/public/track-click` | Pública | publicoRateLimiter |  | [`server/routes/epk_fans.ts:979`](../../server/routes/epk_fans.ts#L979) |
| `GET` | `/api/r/{code}` | Pública | publicoRateLimiter |  | [`server/routes/enlacesCortos.ts:49`](../../server/routes/enlacesCortos.ts#L49) |
| `GET` | `/api/spotify/status` | Pública | — |  | [`server/routes/spotify.ts:13`](../../server/routes/spotify.ts#L13) |
| `GET` | `/api/state` | Sesión (comprobada en el handler) | — |  | [`server.ts:495`](../../server.ts#L495) |
| `POST` | `/api/stripe/webhook` | Firma o secreto | — |  | [`server/routes/billing.ts:972`](../../server/routes/billing.ts#L972) |
| `GET` | `/api/tracking/click` | Pública | — |  | [`server/routes/tracking.ts:144`](../../server/routes/tracking.ts#L144) |
| `POST` | `/api/tracking/interaction` | Pública | — |  | [`server/routes/tracking.ts:255`](../../server/routes/tracking.ts#L255) |
| `GET` | `/api/tracking/open` | Pública | — |  | [`server/routes/tracking.ts:51`](../../server/routes/tracking.ts#L51) |
| `GET` | `/api/tracking/pdf` | Pública | — |  | [`server/routes/tracking.ts:323`](../../server/routes/tracking.ts#L323) |
| `POST` | `/api/webhooks/replicate-stems` | Firma o secreto | — |  | [`server/routes/ai_music/rutasWebhooks.ts:14`](../../server/routes/ai_music/rutasWebhooks.ts#L14) |
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
| `GET` | `/api/admin/agent-funnel` | Sesión | — |  | [`server/routes/agent.ts:1275`](../../server/routes/agent.ts#L1275) |
| `GET` | `/api/agent-logs` | Sesión | — |  | [`server/routes/agent.ts:1204`](../../server/routes/agent.ts#L1204) |
| `POST` | `/api/agent-logs` | Sesión | — |  | [`server/routes/agent.ts:1228`](../../server/routes/agent.ts#L1228) |
| `GET` | `/api/agent-runs` | Sesión | — |  | [`server/routes/agent.ts:1015`](../../server/routes/agent.ts#L1015) |
| `GET` | `/api/agent-runs/{runId}/jobs` | Sesión | — |  | [`server/routes/agent.ts:1084`](../../server/routes/agent.ts#L1084) |
| `POST` | `/api/agents/test-intel` | Sesión | — |  | [`server/routes/agent.ts:976`](../../server/routes/agent.ts#L976) |
| `POST` | `/api/internal/agents/responder-hilo` | Sesión | — |  | [`server/routes/agent.ts:932`](../../server/routes/agent.ts#L932) |
| `POST` | `/api/reset` | Sesión + líder | — |  | [`server/routes/agent.ts:1178`](../../server/routes/agent.ts#L1178) |
| `POST` | `/api/trigger-agent` | Sesión | — |  | [`server/routes/agent.ts:88`](../../server/routes/agent.ts#L88) |

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
| `POST` | `/api/ai-generate-instrument-track` | Sesión | iaRateLimiter |  | [`server/routes/ai_music/rutasGeneracion.ts:117`](../../server/routes/ai_music/rutasGeneracion.ts#L117) |
| `POST` | `/api/ai-stem-separation` | Sesión | iaRateLimiter |  | [`server/routes/ai_music/rutaSeparacion.ts:119`](../../server/routes/ai_music/rutaSeparacion.ts#L119) |
| `GET` | `/api/ai-stem-separation/fal-diagnostic` | Sesión | — |  | [`server/routes/ai_music/rutasEstadoStems.ts:111`](../../server/routes/ai_music/rutasEstadoStems.ts#L111) |
| `GET` | `/api/ai-stem-separation/status` | Sesión | — |  | [`server/routes/ai_music/rutasEstadoStems.ts:18`](../../server/routes/ai_music/rutasEstadoStems.ts#L18) |
| `POST` | `/api/api/webhooks/replicate-stems` | Firma o secreto | — |  | [`server/routes/ai_music/rutasWebhooks.ts:14`](../../server/routes/ai_music/rutasWebhooks.ts#L14) |
| `POST` | `/api/generate` | Sesión | iaRateLimiter |  | [`server/routes/ai_music/rutasGeneracion.ts:19`](../../server/routes/ai_music/rutasGeneracion.ts#L19) |
| `POST` | `/api/generate-music` | Sesión | iaRateLimiter |  | [`server/routes/ai_music/rutasGeneracion.ts:19`](../../server/routes/ai_music/rutasGeneracion.ts#L19) |
| `POST` | `/api/webhooks/replicate-stems` | Firma o secreto | — |  | [`server/routes/ai_music/rutasWebhooks.ts:14`](../../server/routes/ai_music/rutasWebhooks.ts#L14) |

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
| `GET` | `/api/bands` | Sesión | — |  | [`server/routes/bands.ts:93`](../../server/routes/bands.ts#L93) |
| `POST` | `/api/bands` | Sesión | — |  | [`server/routes/bands.ts:108`](../../server/routes/bands.ts#L108) |
| `POST` | `/api/bands/ai-lookup` | Sesión | — |  | [`server/routes/bands.ts:290`](../../server/routes/bands.ts#L290) |
| `POST` | `/api/bands/ai-scout` | Sesión | — |  | [`server/routes/bands.ts:229`](../../server/routes/bands.ts#L229) |
| `GET` | `/api/bands/alert-settings` | Sesión | — |  | [`server/routes/bands.ts:868`](../../server/routes/bands.ts#L868) |
| `POST` | `/api/bands/alert-settings` | Sesión | — |  | [`server/routes/bands.ts:880`](../../server/routes/bands.ts#L880) |
| `POST` | `/api/bands/analyze-tone` | Sesión | — |  | [`server/routes/bands.ts:354`](../../server/routes/bands.ts#L354) |
| `POST` | `/api/bands/bulk-delete` | Sesión | — |  | [`server/routes/bands.ts:169`](../../server/routes/bands.ts#L169) |
| `POST` | `/api/bands/email-account` | Sesión | — |  | [`server/routes/bands.ts:742`](../../server/routes/bands.ts#L742) |
| `GET` | `/api/bands/email-account/{bandId}` | Sesión | — |  | [`server/routes/bands.ts:726`](../../server/routes/bands.ts#L726) |
| `POST` | `/api/bands/generate-logo` | Sesión | iaRateLimiter |  | [`server/routes/bands.ts:984`](../../server/routes/bands.ts#L984) |
| `GET` | `/api/bands/print-settings` | Sesión | — |  | [`server/routes/bands.ts:894`](../../server/routes/bands.ts#L894) |
| `PUT` | `/api/bands/print-settings` | Sesión | — |  | [`server/routes/bands.ts:138`](../../server/routes/bands.ts#L138) |
| `POST` | `/api/bands/schedules` | Sesión | — |  | [`server/routes/bands.ts:699`](../../server/routes/bands.ts#L699) |
| `GET` | `/api/bands/schedules/{bandId}` | Sesión | — |  | [`server/routes/bands.ts:683`](../../server/routes/bands.ts#L683) |
| `POST` | `/api/bands/send-reminder` | Sesión | — |  | [`server/routes/bands.ts:780`](../../server/routes/bands.ts#L780) |
| `POST` | `/api/bands/sync` | Sesión | — |  | [`server/routes/bands.ts:206`](../../server/routes/bands.ts#L206) |
| `GET` | `/api/bands/tone-dna` | Sesión | — |  | [`server/routes/bands.ts:568`](../../server/routes/bands.ts#L568) |
| `PATCH` | `/api/bands/tone-dna` | Sesión | — |  | [`server/routes/bands.ts:579`](../../server/routes/bands.ts#L579) |
| `PATCH` | `/api/bands/tone-dna/learned-rules` | Sesión | — |  | [`server/routes/bands.ts:630`](../../server/routes/bands.ts#L630) |
| `POST` | `/api/bands/trigger-alert-digest` | Sesión | — |  | [`server/routes/bands.ts:906`](../../server/routes/bands.ts#L906) |
| `PUT` | `/api/bands/{id}` | Sesión | — |  | [`server/routes/bands.ts:149`](../../server/routes/bands.ts#L149) |
| `DELETE` | `/api/bands/{id}` | Sesión | — |  | [`server/routes/bands.ts:190`](../../server/routes/bands.ts#L190) |
| `GET` | `/api/response-strategies` | Sesión | — |  | [`server/routes/bands/responseStrategies.ts:50`](../../server/routes/bands/responseStrategies.ts#L50) |
| `POST` | `/api/response-strategies` | Sesión | — |  | [`server/routes/bands/responseStrategies.ts:74`](../../server/routes/bands/responseStrategies.ts#L74) |
| `DELETE` | `/api/response-strategies/{responseType}` | Sesión | — |  | [`server/routes/bands/responseStrategies.ts:110`](../../server/routes/bands/responseStrategies.ts#L110) |

### billing

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/billing/confirm-success` | Sesión | — |  | [`server/routes/billing.ts:471`](../../server/routes/billing.ts#L471) |
| `POST` | `/api/billing/consume-credits` | Sesión | — |  | [`server/routes/billing.ts:874`](../../server/routes/billing.ts#L874) |
| `POST` | `/api/billing/create-checkout-session` | Sesión | — |  | [`server/routes/billing.ts:541`](../../server/routes/billing.ts#L541) |
| `POST` | `/api/billing/create-portal-session` | Sesión | — |  | [`server/routes/billing.ts:653`](../../server/routes/billing.ts#L653) |
| `GET` | `/api/billing/credits-status` | Sesión | — |  | [`server/routes/billing.ts:941`](../../server/routes/billing.ts#L941) |
| `POST` | `/api/billing/webhook` | Firma o secreto | — |  | [`server/routes/billing.ts:971`](../../server/routes/billing.ts#L971) |
| `POST` | `/api/stripe/confirm-success` | Sesión | — |  | [`server/routes/billing.ts:471`](../../server/routes/billing.ts#L471) |
| `POST` | `/api/stripe/consume-credits` | Sesión | — |  | [`server/routes/billing.ts:874`](../../server/routes/billing.ts#L874) |
| `POST` | `/api/stripe/create-checkout-session` | Sesión | — |  | [`server/routes/billing.ts:541`](../../server/routes/billing.ts#L541) |
| `POST` | `/api/stripe/create-portal-session` | Sesión | — |  | [`server/routes/billing.ts:653`](../../server/routes/billing.ts#L653) |
| `GET` | `/api/stripe/credits-status` | Sesión | — |  | [`server/routes/billing.ts:941`](../../server/routes/billing.ts#L941) |
| `POST` | `/api/stripe/webhook` | Firma o secreto | — |  | [`server/routes/billing.ts:972`](../../server/routes/billing.ts#L972) |

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
| `POST` | `/api/concert-to-album/analyze` | Sesión | — |  | [`server/routes/concert_to_album.ts:457`](../../server/routes/concert_to_album.ts#L457) |
| `POST` | `/api/concert-to-album/classify-tracks` | Sesión | — |  | [`server/routes/concert_to_album.ts:1365`](../../server/routes/concert_to_album.ts#L1365) |
| `GET` | `/api/concert-to-album/cookies-status` | Sesión | — |  | [`server/routes/concert_to_album.ts:232`](../../server/routes/concert_to_album.ts#L232) |
| `POST` | `/api/concert-to-album/delete-cookies` | Sesión | — |  | [`server/routes/concert_to_album.ts:271`](../../server/routes/concert_to_album.ts#L271) |
| `POST` | `/api/concert-to-album/demo-audio` | Sesión | — |  | [`server/routes/concert_to_album.ts:1553`](../../server/routes/concert_to_album.ts#L1553) |
| `POST` | `/api/concert-to-album/detect-cues` | Sesión | — |  | [`server/routes/concert_to_album.ts:1008`](../../server/routes/concert_to_album.ts#L1008) |
| `POST` | `/api/concert-to-album/preview-snippet` | Sesión | — |  | [`server/routes/concert_to_album.ts:1337`](../../server/routes/concert_to_album.ts#L1337) |
| `POST` | `/api/concert-to-album/process` | Sesión | — |  | [`server/routes/concert_to_album.ts:758`](../../server/routes/concert_to_album.ts#L758) |
| `POST` | `/api/concert-to-album/save-cookies` | Sesión | — |  | [`server/routes/concert_to_album.ts:248`](../../server/routes/concert_to_album.ts#L248) |
| `POST` | `/api/concert-to-album/transcribe-song` | Sesión | — |  | [`server/routes/concert_to_album.ts:1471`](../../server/routes/concert_to_album.ts#L1471) |
| `POST` | `/api/concert-to-album/transcribe-speech` | Sesión | — |  | [`server/routes/concert_to_album.ts:1282`](../../server/routes/concert_to_album.ts#L1282) |

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
| `GET` | `/api/musicians-waitlist` | Sesión | — |  | [`server/routes/epk_fans.ts:1179`](../../server/routes/epk_fans.ts#L1179) |
| `GET` | `/api/public/epk` | Pública | — |  | [`server/routes/epk_fans.ts:467`](../../server/routes/epk_fans.ts#L467) |
| `POST` | `/api/public/fans` | Pública | publicoRateLimiter | ★ | [`server/routes/epk_fans.ts:868`](../../server/routes/epk_fans.ts#L868) |
| `POST` | `/api/public/musicians-waitlist` | Pública | publicoRateLimiter |  | [`server/routes/epk_fans.ts:1112`](../../server/routes/epk_fans.ts#L1112) |
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
| `POST` | `/api/batch-enrich-campaign` | Sesión | — |  | [`server/routes/leads/enrichment.ts:942`](../../server/routes/leads/enrichment.ts#L942) |
| `POST` | `/api/campaign-mass-search` | Sesión | — |  | [`server/routes/leads/places.ts:407`](../../server/routes/leads/places.ts#L407) |
| `POST` | `/api/detect-all-dates` | Sesión | — |  | [`server/routes/leads/enrichment.ts:866`](../../server/routes/leads/enrichment.ts#L866) |
| `GET` | `/api/example-threads` | Sesión | — |  | [`server/routes/leads/exampleThreads.ts:23`](../../server/routes/leads/exampleThreads.ts#L23) |
| `POST` | `/api/example-threads` | Sesión | — |  | [`server/routes/leads/exampleThreads.ts:35`](../../server/routes/leads/exampleThreads.ts#L35) |
| `PUT` | `/api/example-threads/{id}` | Sesión | — |  | [`server/routes/leads/exampleThreads.ts:66`](../../server/routes/leads/exampleThreads.ts#L66) |
| `DELETE` | `/api/example-threads/{id}` | Sesión | — |  | [`server/routes/leads/exampleThreads.ts:90`](../../server/routes/leads/exampleThreads.ts#L90) |
| `POST` | `/api/extract-emails` | Sesión | — |  | [`server/routes/leads/places.ts:822`](../../server/routes/leads/places.ts#L822) |
| `POST` | `/api/generate-simulated-email` | Sesión | — |  | [`server/routes/leads/simulation.ts:9`](../../server/routes/leads/simulation.ts#L9) |
| `POST` | `/api/import-excel` | Sesión | — |  | [`server/routes/leads/import.ts:12`](../../server/routes/leads/import.ts#L12) |
| `POST` | `/api/import-places` | Sesión | — |  | [`server/routes/leads/places.ts:952`](../../server/routes/leads/places.ts#L952) |
| `GET` | `/api/leads` | Sesión | — | ★ | [`server/routes/leads/crud.ts:37`](../../server/routes/leads/crud.ts#L37) |
| `POST` | `/api/leads` | Sesión | — | ★ | [`server/routes/leads/crud.ts:198`](../../server/routes/leads/crud.ts#L198) |
| `POST` | `/api/leads/ai-lookup` | Sesión | — |  | [`server/routes/leads/enrichment.ts:215`](../../server/routes/leads/enrichment.ts#L215) |
| `POST` | `/api/leads/audit-pitch` | Sesión | — |  | [`server/routes/leads/pitch.ts:14`](../../server/routes/leads/pitch.ts#L14) |
| `POST` | `/api/leads/batch-enrich-campaign` | Sesión | — |  | [`server/routes/leads/enrichment.ts:942`](../../server/routes/leads/enrichment.ts#L942) |
| `POST` | `/api/leads/bulk-delete` | Sesión | — |  | [`server/routes/leads/crud.ts:328`](../../server/routes/leads/crud.ts#L328) |
| `POST` | `/api/leads/campaign-mass-search` | Sesión | — |  | [`server/routes/leads/places.ts:407`](../../server/routes/leads/places.ts#L407) |
| `POST` | `/api/leads/detect-all-dates` | Sesión | — |  | [`server/routes/leads/enrichment.ts:866`](../../server/routes/leads/enrichment.ts#L866) |
| `POST` | `/api/leads/enrich-addresses` | Sesión | — |  | [`server/routes/leads/enrichment.ts:611`](../../server/routes/leads/enrichment.ts#L611) |
| `POST` | `/api/leads/enrich-all-band` | Sesión | — |  | [`server/routes/leads/enrichment.ts:446`](../../server/routes/leads/enrichment.ts#L446) |
| `POST` | `/api/leads/enrich-lead` | Sesión | — |  | [`server/routes/leads/enrichment.ts:391`](../../server/routes/leads/enrichment.ts#L391) |
| `POST` | `/api/leads/extract-emails` | Sesión | — |  | [`server/routes/leads/places.ts:822`](../../server/routes/leads/places.ts#L822) |
| `POST` | `/api/leads/import-places` | Sesión | — |  | [`server/routes/leads/places.ts:952`](../../server/routes/leads/places.ts#L952) |
| `POST` | `/api/leads/multi-source-venues` | Sesión | — |  | [`server/routes/leads/places.ts:1105`](../../server/routes/leads/places.ts#L1105) |
| `POST` | `/api/leads/places-search` | Sesión | — |  | [`server/routes/leads/places.ts:35`](../../server/routes/leads/places.ts#L35) |
| `POST` | `/api/leads/public-cultural-radar` | Sesión | — |  | [`server/routes/leads/places.ts:1167`](../../server/routes/leads/places.ts#L1167) |
| `POST` | `/api/leads/realign-headers` | Sesión | — |  | [`server/routes/leads/crud.ts:32`](../../server/routes/leads/crud.ts#L32) |
| `POST` | `/api/leads/similar-artists-venues` | Sesión | — |  | [`server/routes/leads/places.ts:1129`](../../server/routes/leads/places.ts#L1129) |
| `POST` | `/api/leads/train-tone-dna` | Sesión | — |  | [`server/routes/leads/pitch.ts:156`](../../server/routes/leads/pitch.ts#L156) |
| `GET` | `/api/leads/{id}` | Sesión | — | ★ | [`server/routes/leads/crud.ts:97`](../../server/routes/leads/crud.ts#L97) |
| `PUT` | `/api/leads/{id}` | Sesión | — | ★ | [`server/routes/leads/crud.ts:130`](../../server/routes/leads/crud.ts#L130) |
| `DELETE` | `/api/leads/{id}` | Sesión | — |  | [`server/routes/leads/crud.ts:353`](../../server/routes/leads/crud.ts#L353) |
| `POST` | `/api/leads/{id}/analyze-sentiment` | Sesión | — |  | [`server/routes/leads/reply.ts:73`](../../server/routes/leads/reply.ts#L73) |
| `POST` | `/api/leads/{id}/calculate-break-even` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1496`](../../server/routes/leads/enrichment.ts#L1496) |
| `POST` | `/api/leads/{id}/detect-dates` | Sesión | — |  | [`server/routes/leads/enrichment.ts:816`](../../server/routes/leads/enrichment.ts#L816) |
| `POST` | `/api/leads/{id}/enrich-all-apis` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1250`](../../server/routes/leads/enrichment.ts#L1250) |
| `POST` | `/api/leads/{id}/enrich-booking-window` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1549`](../../server/routes/leads/enrichment.ts#L1549) |
| `POST` | `/api/leads/{id}/enrich-co-booking` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1626`](../../server/routes/leads/enrichment.ts#L1626) |
| `POST` | `/api/leads/{id}/enrich-google-places` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1136`](../../server/routes/leads/enrichment.ts#L1136) |
| `POST` | `/api/leads/{id}/enrich-instagram` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1042`](../../server/routes/leads/enrichment.ts#L1042) |
| `POST` | `/api/leads/{id}/enrich-jina` | Sesión | — |  | [`server/routes/leads/enrichment.ts:754`](../../server/routes/leads/enrichment.ts#L754) |
| `POST` | `/api/leads/{id}/enrich-local-events` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1572`](../../server/routes/leads/enrichment.ts#L1572) |
| `POST` | `/api/leads/{id}/enrich-logistics` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1431`](../../server/routes/leads/enrichment.ts#L1431) |
| `POST` | `/api/leads/{id}/enrich-press-media` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1599`](../../server/routes/leads/enrichment.ts#L1599) |
| `POST` | `/api/leads/{id}/enrich-setlist` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1175`](../../server/routes/leads/enrichment.ts#L1175) |
| `POST` | `/api/leads/{id}/enrich-social` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1466`](../../server/routes/leads/enrichment.ts#L1466) |
| `POST` | `/api/leads/{id}/enrich-spotify` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1093`](../../server/routes/leads/enrichment.ts#L1093) |
| `POST` | `/api/leads/{id}/generate-multi-pitch` | Sesión | — |  | [`server/routes/leads/pitch.ts:32`](../../server/routes/leads/pitch.ts#L32) |
| `POST` | `/api/leads/{id}/generate-reply` | Sesión | — |  | [`server/routes/leads/reply.ts:18`](../../server/routes/leads/reply.ts#L18) |
| `GET` | `/api/leads/{id}/messages` | Sesión | — |  | [`server/routes/leads/crud.ts:117`](../../server/routes/leads/crud.ts#L117) |
| `POST` | `/api/leads/{id}/regenerate-pitch` | Sesión | — |  | [`server/routes/leads/pitch.ts:62`](../../server/routes/leads/pitch.ts#L62) |
| `POST` | `/api/leads/{id}/regenerate-reply` | Sesión | — |  | [`server/routes/leads/reply.ts:152`](../../server/routes/leads/reply.ts#L152) |
| `POST` | `/api/leads/{id}/revert-pitch` | Sesión | — |  | [`server/routes/leads/pitch.ts:96`](../../server/routes/leads/pitch.ts#L96) |
| `POST` | `/api/leads/{id}/verify-email` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1212`](../../server/routes/leads/enrichment.ts#L1212) |
| `POST` | `/api/multi-source-venues` | Sesión | — |  | [`server/routes/leads/places.ts:1105`](../../server/routes/leads/places.ts#L1105) |
| `POST` | `/api/places-search` | Sesión | — |  | [`server/routes/leads/places.ts:35`](../../server/routes/leads/places.ts#L35) |
| `POST` | `/api/public-cultural-radar` | Sesión | — |  | [`server/routes/leads/places.ts:1167`](../../server/routes/leads/places.ts#L1167) |
| `POST` | `/api/scrape-contact` | Sesión | — |  | [`server/routes/leads/enrichment.ts:498`](../../server/routes/leads/enrichment.ts#L498) |
| `POST` | `/api/similar-artists-venues` | Sesión | — |  | [`server/routes/leads/places.ts:1129`](../../server/routes/leads/places.ts#L1129) |
| `GET` | `/api/templates` | Sesión | — |  | [`server/routes/leads/templates.ts:55`](../../server/routes/leads/templates.ts#L55) |
| `POST` | `/api/templates/generate-all` | Sesión | — |  | [`server/routes/leads/templates.ts:342`](../../server/routes/leads/templates.ts#L342) |
| `POST` | `/api/templates/optimize` | Sesión | — |  | [`server/routes/leads/templates.ts:246`](../../server/routes/leads/templates.ts#L246) |
| `POST` | `/api/templates/preview` | Sesión | — |  | [`server/routes/leads/templates.ts:144`](../../server/routes/leads/templates.ts#L144) |
| `POST` | `/api/templates/reset` | Sesión | — |  | [`server/routes/leads/templates.ts:644`](../../server/routes/leads/templates.ts#L644) |
| `POST` | `/api/templates/save` | Sesión | — |  | [`server/routes/leads/templates.ts:71`](../../server/routes/leads/templates.ts#L71) |
| `GET` | `/api/templates/stats` | Sesión | — |  | [`server/routes/leads/templates.ts:504`](../../server/routes/leads/templates.ts#L504) |
| `GET` | `/api/validate-emails` | Sesión | — |  | [`server/routes/leads/emailValidation.ts:14`](../../server/routes/leads/emailValidation.ts#L14) |
| `POST` | `/api/{id}/calculate-break-even` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1496`](../../server/routes/leads/enrichment.ts#L1496) |
| `POST` | `/api/{id}/detect-dates` | Sesión | — |  | [`server/routes/leads/enrichment.ts:816`](../../server/routes/leads/enrichment.ts#L816) |
| `POST` | `/api/{id}/enrich-all-apis` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1250`](../../server/routes/leads/enrichment.ts#L1250) |
| `POST` | `/api/{id}/enrich-booking-window` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1549`](../../server/routes/leads/enrichment.ts#L1549) |
| `POST` | `/api/{id}/enrich-co-booking` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1626`](../../server/routes/leads/enrichment.ts#L1626) |
| `POST` | `/api/{id}/enrich-google-places` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1136`](../../server/routes/leads/enrichment.ts#L1136) |
| `POST` | `/api/{id}/enrich-instagram` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1042`](../../server/routes/leads/enrichment.ts#L1042) |
| `POST` | `/api/{id}/enrich-jina` | Sesión | — |  | [`server/routes/leads/enrichment.ts:754`](../../server/routes/leads/enrichment.ts#L754) |
| `POST` | `/api/{id}/enrich-local-events` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1572`](../../server/routes/leads/enrichment.ts#L1572) |
| `POST` | `/api/{id}/enrich-logistics` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1431`](../../server/routes/leads/enrichment.ts#L1431) |
| `POST` | `/api/{id}/enrich-press-media` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1599`](../../server/routes/leads/enrichment.ts#L1599) |
| `POST` | `/api/{id}/enrich-setlist` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1175`](../../server/routes/leads/enrichment.ts#L1175) |
| `POST` | `/api/{id}/enrich-social` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1466`](../../server/routes/leads/enrichment.ts#L1466) |
| `POST` | `/api/{id}/enrich-spotify` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1093`](../../server/routes/leads/enrichment.ts#L1093) |
| `POST` | `/api/{id}/verify-email` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1212`](../../server/routes/leads/enrichment.ts#L1212) |

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
| `POST` | `/api/songs/{songId}/upload-structure` | Sesión | — |  | [`server/routes/songs/structureUpload.ts:158`](../../server/routes/songs/structureUpload.ts#L158) |

### spotify

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/spotify/artist-discography` | Sesión | — |  | [`server/routes/spotify.ts:63`](../../server/routes/spotify.ts#L63) |
| `POST` | `/api/spotify/import-discography` | Sesión | — |  | [`server/routes/spotify.ts:82`](../../server/routes/spotify.ts#L82) |
| `GET` | `/api/spotify/preview` | Sesión | — |  | [`server/routes/spotify.ts:26`](../../server/routes/spotify.ts#L26) |
| `GET` | `/api/spotify/search` | Sesión | — |  | [`server/routes/spotify.ts:44`](../../server/routes/spotify.ts#L44) |
| `GET` | `/api/spotify/status` | Pública | — |  | [`server/routes/spotify.ts:13`](../../server/routes/spotify.ts#L13) |

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
| `POST` | `/api/auth/activate-member` | Sesión opcional | loginRateLimiter |  | [`server/routes/users/rutasInvitacion.ts:73`](../../server/routes/users/rutasInvitacion.ts#L73) |
| `POST` | `/api/auth/check-invitation` | Pública | loginRateLimiter |  | [`server/routes/users/rutasInvitacion.ts:17`](../../server/routes/users/rutasInvitacion.ts#L17) |
| `POST` | `/api/auth/google` | Sesión (comprobada en el handler) | loginRateLimiter |  | [`server/routes/users/rutasGoogle.ts:17`](../../server/routes/users/rutasGoogle.ts#L17) |
| `POST` | `/api/auth/login` | Sesión (comprobada en el handler) | loginRateLimiter | ★ | [`server/routes/users/rutasLogin.ts:15`](../../server/routes/users/rutasLogin.ts#L15) |
| `POST` | `/api/auth/logout` | Sesión opcional | — |  | [`server/routes/users/rutasSesion.ts:340`](../../server/routes/users/rutasSesion.ts#L340) |
| `GET` | `/api/auth/me` | Sesión (comprobada en el handler) | — |  | [`server/routes/users/rutasSesion.ts:13`](../../server/routes/users/rutasSesion.ts#L13) |
| `POST` | `/api/auth/register` | Sesión opcional | registroRateLimiter |  | [`server/routes/users/rutasRegistro.ts:17`](../../server/routes/users/rutasRegistro.ts#L17) |
| `POST` | `/api/auth/reset-password/confirm` | Firma o secreto | loginRateLimiter |  | [`server/routes/users/rutasRecuperacion.ts:203`](../../server/routes/users/rutasRecuperacion.ts#L203) |
| `POST` | `/api/auth/reset-password/request` | Pública | loginRateLimiter |  | [`server/routes/users/rutasRecuperacion.ts:16`](../../server/routes/users/rutasRecuperacion.ts#L16) |
| `POST` | `/api/auth/switch-band` | Sesión (comprobada en el handler) | — |  | [`server/routes/users/rutasSesion.ts:135`](../../server/routes/users/rutasSesion.ts#L135) |
| `POST` | `/api/auth/test-email` | Sesión | — |  | [`server/routes/users/rutasRecuperacion.ts:326`](../../server/routes/users/rutasRecuperacion.ts#L326) |
| `POST` | `/api/bands/logo` | Sesión | — |  | [`server/routes/users/rutasBandas.ts:14`](../../server/routes/users/rutasBandas.ts#L14) |
| `POST` | `/api/bands/upload-logo` | Sesión | — |  | [`server/routes/users/rutasBandas.ts:14`](../../server/routes/users/rutasBandas.ts#L14) |
| `POST` | `/api/create-band` | Sesión | — |  | [`server/routes/users/rutasBandas.ts:98`](../../server/routes/users/rutasBandas.ts#L98) |
| `DELETE` | `/api/leave-band/{bandId}` | Sesión | — |  | [`server/routes/users/rutasSalidaBanda.ts:13`](../../server/routes/users/rutasSalidaBanda.ts#L13) |
| `GET` | `/api/registered-bands` | Sesión | — |  | [`server/routes/users/rutasRegistro.ts:311`](../../server/routes/users/rutasRegistro.ts#L311) |
| `POST` | `/api/set-band-order` | Sesión | — |  | [`server/routes/users/rutasPreferencias.ts:126`](../../server/routes/users/rutasPreferencias.ts#L126) |
| `POST` | `/api/set-main-band` | Sesión | — |  | [`server/routes/users/rutasPreferencias.ts:13`](../../server/routes/users/rutasPreferencias.ts#L13) |
| `GET` | `/api/ui-preferences` | Sesión | — |  | [`server/routes/users/rutasPreferencias.ts:253`](../../server/routes/users/rutasPreferencias.ts#L253) |
| `POST` | `/api/ui-preferences` | Sesión | — |  | [`server/routes/users/rutasPreferencias.ts:181`](../../server/routes/users/rutasPreferencias.ts#L181) |
| `POST` | `/api/upload-logo` | Sesión | — |  | [`server/routes/users/rutasBandas.ts:14`](../../server/routes/users/rutasBandas.ts#L14) |
| `GET` | `/api/users` | Sesión | — |  | [`server/routes/users/rutasMiembros.ts:101`](../../server/routes/users/rutasMiembros.ts#L101) |
| `POST` | `/api/users` | Sesión + líder | — |  | [`server/routes/users/rutasMiembros.ts:144`](../../server/routes/users/rutasMiembros.ts#L144) |
| `POST` | `/api/users/associate` | Sesión + líder | — |  | [`server/routes/users/rutasMiembros.ts:16`](../../server/routes/users/rutasMiembros.ts#L16) |
| `POST` | `/api/users/create-band` | Sesión | — |  | [`server/routes/users/rutasBandas.ts:98`](../../server/routes/users/rutasBandas.ts#L98) |
| `DELETE` | `/api/users/leave-band/{bandId}` | Sesión | — |  | [`server/routes/users/rutasSalidaBanda.ts:13`](../../server/routes/users/rutasSalidaBanda.ts#L13) |
| `GET` | `/api/users/registered-bands` | Sesión | — |  | [`server/routes/users/rutasRegistro.ts:312`](../../server/routes/users/rutasRegistro.ts#L312) |
| `POST` | `/api/users/set-band-order` | Sesión | — |  | [`server/routes/users/rutasPreferencias.ts:126`](../../server/routes/users/rutasPreferencias.ts#L126) |
| `POST` | `/api/users/set-main-band` | Sesión | — |  | [`server/routes/users/rutasPreferencias.ts:13`](../../server/routes/users/rutasPreferencias.ts#L13) |
| `GET` | `/api/users/ui-preferences` | Sesión | — |  | [`server/routes/users/rutasPreferencias.ts:253`](../../server/routes/users/rutasPreferencias.ts#L253) |
| `POST` | `/api/users/ui-preferences` | Sesión | — |  | [`server/routes/users/rutasPreferencias.ts:181`](../../server/routes/users/rutasPreferencias.ts#L181) |
| `POST` | `/api/users/upload-logo` | Sesión | — |  | [`server/routes/users/rutasBandas.ts:14`](../../server/routes/users/rutasBandas.ts#L14) |
| `PUT` | `/api/users/{id}` | Sesión | — |  | [`server/routes/users/rutasMiembrosEdicion.ts:15`](../../server/routes/users/rutasMiembrosEdicion.ts#L15) |
| `DELETE` | `/api/users/{id}` | Sesión + líder | — |  | [`server/routes/users/rutasMiembrosEdicion.ts:228`](../../server/routes/users/rutasMiembrosEdicion.ts#L228) |

## Avisos del análisis estático

Declaradas dos veces (Express usa la primera; la segunda es código muerto):

- POST /api/templates/preview (server/routes/leads/templates.ts:144 y server/routes/leads/templates.ts:448)

- Sin rutas sombreadas.

Omitidas a propósito:

- GET /* (server.ts:579): fallback de la SPA, no es API

