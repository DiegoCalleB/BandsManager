# Referencia de la API

> Generado automáticamente por `scripts/generate-openapi.mjs` a partir del código. No se edita a mano: ejecuta `npm run docs:api`.

**360 rutas HTTP** (309 declaraciones de handler; el resto son alias) en 31 dominios. Contrato máquina-legible: [`openapi.json`](./openapi.json) (OpenAPI 3.1). Visor interactivo: [`index.html`](./index.html) (hay que abrirlo en un navegador; GitHub no lo renderiza). Decisión de diseño: [ADR 0012](../adr/0012-contrato-api-openapi-por-ast.md).

## Cómo leerla

- **Acceso** es lo que el código muestra, no lo que se supone. Una ruta "Pública" es una ruta sin ninguna comprobación detectada; puede ser intencionada (login, páginas públicas) y conviene revisarla.
- **Esquema ★** significa que la petición y la respuesta están descritas a mano en [`overrides.json`](./overrides.json). El resto solo documenta la superficie (método, ruta, acceso, límites, código): el proyecto no usa una librería de validación de la que derivar esquemas.
- La banda activa se envía en la cabecera `x-band-id` y el servidor la valida contra las bandas del usuario ([ADR 0004](../adr/0004-band-id-resuelto-en-servidor.md)).

| Acceso | Rutas |
|---|---|
| Sesión | 314 |
| Sesión (comprobada en el handler) | 6 |
| Sesión opcional | 3 |
| Firma o secreto | 7 |
| Pública | 30 |

## Rutas sin sesión de middleware

Son las que un revisor de seguridad querrá mirar primero.

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/api/tracking/click` | Pública | — |  | [`server/routes/tracking.ts:147`](../../server/routes/tracking.ts#L147) |
| `POST` | `/api/api/tracking/interaction` | Pública | — |  | [`server/routes/tracking.ts:259`](../../server/routes/tracking.ts#L259) |
| `GET` | `/api/api/tracking/open` | Pública | — |  | [`server/routes/tracking.ts:53`](../../server/routes/tracking.ts#L53) |
| `GET` | `/api/api/tracking/pdf` | Pública | — |  | [`server/routes/tracking.ts:328`](../../server/routes/tracking.ts#L328) |
| `POST` | `/api/api/webhooks/replicate-stems` | Firma o secreto | webhookRateLimiter |  | [`server/routes/ai_music/rutasWebhooks.ts:17`](../../server/routes/ai_music/rutasWebhooks.ts#L17) |
| `POST` | `/api/auth/activate-member` | Sesión opcional | loginRateLimiter |  | [`server/routes/users/rutasInvitacion.ts:73`](../../server/routes/users/rutasInvitacion.ts#L73) |
| `POST` | `/api/auth/check-invitation` | Pública | loginRateLimiter |  | [`server/routes/users/rutasInvitacion.ts:17`](../../server/routes/users/rutasInvitacion.ts#L17) |
| `POST` | `/api/auth/google` | Sesión (comprobada en el handler) | loginRateLimiter |  | [`server/routes/users/rutasGoogle.ts:19`](../../server/routes/users/rutasGoogle.ts#L19) |
| `POST` | `/api/auth/login` | Sesión (comprobada en el handler) | loginRateLimiter | ★ | [`server/routes/users/rutasLogin.ts:16`](../../server/routes/users/rutasLogin.ts#L16) |
| `POST` | `/api/auth/logout` | Sesión opcional | — |  | [`server/routes/users/rutasSesion.ts:321`](../../server/routes/users/rutasSesion.ts#L321) |
| `GET` | `/api/auth/me` | Sesión (comprobada en el handler) | — |  | [`server/routes/users/rutasSesion.ts:14`](../../server/routes/users/rutasSesion.ts#L14) |
| `POST` | `/api/auth/register` | Sesión opcional | registroRateLimiter |  | [`server/routes/users/rutasRegistro.ts:19`](../../server/routes/users/rutasRegistro.ts#L19) |
| `POST` | `/api/auth/reset-password/confirm` | Firma o secreto | loginRateLimiter |  | [`server/routes/users/rutasRecuperacion.ts:204`](../../server/routes/users/rutasRecuperacion.ts#L204) |
| `POST` | `/api/auth/reset-password/request` | Pública | loginRateLimiter |  | [`server/routes/users/rutasRecuperacion.ts:17`](../../server/routes/users/rutasRecuperacion.ts#L17) |
| `POST` | `/api/auth/switch-band` | Sesión (comprobada en el handler) | — |  | [`server/routes/users/rutasSesion.ts:136`](../../server/routes/users/rutasSesion.ts#L136) |
| `POST` | `/api/billing/webhook` | Firma o secreto | — |  | [`server/routes/billing.ts:987`](../../server/routes/billing.ts#L987) |
| `GET` | `/api/calendar.ics` | Firma o secreto | — |  | [`server/routes/concerts.ts:443`](../../server/routes/concerts.ts#L443) |
| `GET` | `/api/download-excel` | Sesión (comprobada en el handler) | — |  | [`server.ts:269`](../../server.ts#L269) |
| `GET` | `/api/emails/baja` | Pública | publicoRateLimiter |  | [`server/routes/emailsCicloVida.ts:13`](../../server/routes/emailsCicloVida.ts#L13) |
| `GET` | `/api/gmail-oauth/callback` | Pública | gmailOAuthRateLimiter |  | [`server/routes/gmailOAuth.ts:159`](../../server/routes/gmailOAuth.ts#L159) |
| `GET` | `/api/health` | Pública | — | ★ | [`server.ts:168`](../../server.ts#L168) |
| `GET` | `/api/public/deals/{token}` | Pública | — |  | [`server/routes/deals.ts:225`](../../server/routes/deals.ts#L225) |
| `POST` | `/api/public/deals/{token}/resend-email` | Pública | reenvioEmailRateLimiter |  | [`server/routes/deals.ts:452`](../../server/routes/deals.ts#L452) |
| `POST` | `/api/public/deals/{token}/sign` | Pública | — | ★ | [`server/routes/deals.ts:305`](../../server/routes/deals.ts#L305) |
| `GET` | `/api/public/epk` | Pública | — |  | [`server/routes/epk_fans.ts:471`](../../server/routes/epk_fans.ts#L471) |
| `POST` | `/api/public/fans` | Pública | publicoRateLimiter | ★ | [`server/routes/epk_fans.ts:876`](../../server/routes/epk_fans.ts#L876) |
| `GET` | `/api/public/insignia` | Pública | publicoRateLimiter |  | [`server/routes/referidos.ts:76`](../../server/routes/referidos.ts#L76) |
| `POST` | `/api/public/musicians-waitlist` | Pública | publicoRateLimiter |  | [`server/routes/epk_fans.ts:1122`](../../server/routes/epk_fans.ts#L1122) |
| `POST` | `/api/public/track-click` | Pública | publicoRateLimiter |  | [`server/routes/epk_fans.ts:988`](../../server/routes/epk_fans.ts#L988) |
| `GET` | `/api/r/{code}` | Pública | publicoRateLimiter |  | [`server/routes/enlacesCortos.ts:49`](../../server/routes/enlacesCortos.ts#L49) |
| `GET` | `/api/spotify/status` | Pública | — |  | [`server/routes/spotify.ts:14`](../../server/routes/spotify.ts#L14) |
| `GET` | `/api/state` | Sesión (comprobada en el handler) | — |  | [`server.ts:511`](../../server.ts#L511) |
| `POST` | `/api/stripe/webhook` | Firma o secreto | — |  | [`server/routes/billing.ts:988`](../../server/routes/billing.ts#L988) |
| `GET` | `/api/tracking/click` | Pública | — |  | [`server/routes/tracking.ts:147`](../../server/routes/tracking.ts#L147) |
| `POST` | `/api/tracking/interaction` | Pública | — |  | [`server/routes/tracking.ts:259`](../../server/routes/tracking.ts#L259) |
| `GET` | `/api/tracking/open` | Pública | — |  | [`server/routes/tracking.ts:53`](../../server/routes/tracking.ts#L53) |
| `GET` | `/api/tracking/pdf` | Pública | — |  | [`server/routes/tracking.ts:328`](../../server/routes/tracking.ts#L328) |
| `POST` | `/api/webhooks/replicate-stems` | Firma o secreto | webhookRateLimiter |  | [`server/routes/ai_music/rutasWebhooks.ts:17`](../../server/routes/ai_music/rutasWebhooks.ts#L17) |
| `POST` | `/api/webhooks/resend` | Firma o secreto | publicoRateLimiter |  | [`server/routes/tracking.ts:464`](../../server/routes/tracking.ts#L464) |
| `GET` | `/e/{slug}` | Pública | publicoRateLimiter |  | [`server/routes/paginaConcierto.ts:44`](../../server/routes/paginaConcierto.ts#L44) |
| `GET` | `/health` | Pública | — |  | [`server.ts:168`](../../server.ts#L168) |
| `GET` | `/privacy` | Pública | — |  | [`server.ts:182`](../../server.ts#L182) |
| `GET` | `/r/{code}` | Pública | publicoRateLimiter |  | [`server/routes/enlacesCortos.ts:49`](../../server/routes/enlacesCortos.ts#L49) |
| `GET` | `/robots.txt` | Pública | — |  | [`server/routes/paginaConcierto.ts:159`](../../server/routes/paginaConcierto.ts#L159) |
| `GET` | `/sitemap.xml` | Pública | publicoRateLimiter |  | [`server/routes/paginaConcierto.ts:141`](../../server/routes/paginaConcierto.ts#L141) |
| `GET` | `/terms` | Pública | — |  | [`server.ts:224`](../../server.ts#L224) |

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
| `GET` | `/api/admin/agent-funnel` | Sesión | — |  | [`server/routes/agent.ts:1304`](../../server/routes/agent.ts#L1304) |
| `GET` | `/api/agent-logs` | Sesión | — |  | [`server/routes/agent.ts:1231`](../../server/routes/agent.ts#L1231) |
| `POST` | `/api/agent-logs` | Sesión | — |  | [`server/routes/agent.ts:1256`](../../server/routes/agent.ts#L1256) |
| `GET` | `/api/agent-runs` | Sesión | — |  | [`server/routes/agent.ts:1033`](../../server/routes/agent.ts#L1033) |
| `GET` | `/api/agent-runs/{runId}/jobs` | Sesión | — |  | [`server/routes/agent.ts:1103`](../../server/routes/agent.ts#L1103) |
| `POST` | `/api/agents/test-intel` | Sesión | — |  | [`server/routes/agent.ts:993`](../../server/routes/agent.ts#L993) |
| `POST` | `/api/internal/agents/responder-hilo` | Sesión | — |  | [`server/routes/agent.ts:948`](../../server/routes/agent.ts#L948) |
| `POST` | `/api/reset` | Sesión + líder | — |  | [`server/routes/agent.ts:1200`](../../server/routes/agent.ts#L1200) |
| `POST` | `/api/trigger-agent` | Sesión | — |  | [`server/routes/agent.ts:94`](../../server/routes/agent.ts#L94) |

### agentQueue

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/agent-queue/enqueue` | Sesión | — |  | [`server/routes/agentQueue.ts:66`](../../server/routes/agentQueue.ts#L66) |
| `GET` | `/api/agent-queue/metrics` | Sesión | — |  | [`server/routes/agentQueue.ts:36`](../../server/routes/agentQueue.ts#L36) |
| `POST` | `/api/agent-queue/prune` | Sesión | — |  | [`server/routes/agentQueue.ts:51`](../../server/routes/agentQueue.ts#L51) |
| `GET` | `/api/agent-queue/stats` | Sesión | — |  | [`server/routes/agentQueue.ts:21`](../../server/routes/agentQueue.ts#L21) |

### ai_music

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/ai-generate-instrument-track` | Sesión | iaRateLimiter |  | [`server/routes/ai_music/rutasGeneracion.ts:120`](../../server/routes/ai_music/rutasGeneracion.ts#L120) |
| `POST` | `/api/ai-stem-separation` | Sesión | iaRateLimiter |  | [`server/routes/ai_music/rutaSeparacion.ts:119`](../../server/routes/ai_music/rutaSeparacion.ts#L119) |
| `GET` | `/api/ai-stem-separation/fal-diagnostic` | Sesión | — |  | [`server/routes/ai_music/rutasEstadoStems.ts:112`](../../server/routes/ai_music/rutasEstadoStems.ts#L112) |
| `GET` | `/api/ai-stem-separation/status` | Sesión | — |  | [`server/routes/ai_music/rutasEstadoStems.ts:20`](../../server/routes/ai_music/rutasEstadoStems.ts#L20) |
| `POST` | `/api/api/webhooks/replicate-stems` | Firma o secreto | webhookRateLimiter |  | [`server/routes/ai_music/rutasWebhooks.ts:17`](../../server/routes/ai_music/rutasWebhooks.ts#L17) |
| `POST` | `/api/generate` | Sesión | iaRateLimiter |  | [`server/routes/ai_music/rutasGeneracion.ts:20`](../../server/routes/ai_music/rutasGeneracion.ts#L20) |
| `POST` | `/api/generate-music` | Sesión | iaRateLimiter |  | [`server/routes/ai_music/rutasGeneracion.ts:20`](../../server/routes/ai_music/rutasGeneracion.ts#L20) |
| `POST` | `/api/webhooks/replicate-stems` | Firma o secreto | webhookRateLimiter |  | [`server/routes/ai_music/rutasWebhooks.ts:17`](../../server/routes/ai_music/rutasWebhooks.ts#L17) |

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
| `POST` | `/api/bands` | Sesión | — |  | [`server/routes/bands.ts:109`](../../server/routes/bands.ts#L109) |
| `POST` | `/api/bands/ai-lookup` | Sesión | — |  | [`server/routes/bands.ts:298`](../../server/routes/bands.ts#L298) |
| `POST` | `/api/bands/ai-scout` | Sesión | — |  | [`server/routes/bands.ts:236`](../../server/routes/bands.ts#L236) |
| `GET` | `/api/bands/alert-settings` | Sesión | — |  | [`server/routes/bands.ts:891`](../../server/routes/bands.ts#L891) |
| `POST` | `/api/bands/alert-settings` | Sesión | — |  | [`server/routes/bands.ts:904`](../../server/routes/bands.ts#L904) |
| `POST` | `/api/bands/analyze-tone` | Sesión | — |  | [`server/routes/bands.ts:363`](../../server/routes/bands.ts#L363) |
| `POST` | `/api/bands/bulk-delete` | Sesión | — |  | [`server/routes/bands.ts:173`](../../server/routes/bands.ts#L173) |
| `POST` | `/api/bands/email-account` | Sesión | — |  | [`server/routes/bands.ts:762`](../../server/routes/bands.ts#L762) |
| `GET` | `/api/bands/email-account/{bandId}` | Sesión | — |  | [`server/routes/bands.ts:745`](../../server/routes/bands.ts#L745) |
| `POST` | `/api/bands/generate-logo` | Sesión | iaRateLimiter |  | [`server/routes/bands.ts:1014`](../../server/routes/bands.ts#L1014) |
| `GET` | `/api/bands/print-settings` | Sesión | — |  | [`server/routes/bands.ts:921`](../../server/routes/bands.ts#L921) |
| `PUT` | `/api/bands/print-settings` | Sesión | — |  | [`server/routes/bands.ts:140`](../../server/routes/bands.ts#L140) |
| `POST` | `/api/bands/schedules` | Sesión | — |  | [`server/routes/bands.ts:717`](../../server/routes/bands.ts#L717) |
| `GET` | `/api/bands/schedules/{bandId}` | Sesión | — |  | [`server/routes/bands.ts:700`](../../server/routes/bands.ts#L700) |
| `POST` | `/api/bands/send-reminder` | Sesión | — |  | [`server/routes/bands.ts:801`](../../server/routes/bands.ts#L801) |
| `POST` | `/api/bands/sync` | Sesión | — |  | [`server/routes/bands.ts:212`](../../server/routes/bands.ts#L212) |
| `GET` | `/api/bands/tone-dna` | Sesión | — |  | [`server/routes/bands.ts:582`](../../server/routes/bands.ts#L582) |
| `PATCH` | `/api/bands/tone-dna` | Sesión | — |  | [`server/routes/bands.ts:594`](../../server/routes/bands.ts#L594) |
| `PATCH` | `/api/bands/tone-dna/learned-rules` | Sesión | — |  | [`server/routes/bands.ts:646`](../../server/routes/bands.ts#L646) |
| `POST` | `/api/bands/trigger-alert-digest` | Sesión | — |  | [`server/routes/bands.ts:934`](../../server/routes/bands.ts#L934) |
| `PUT` | `/api/bands/{id}` | Sesión | — |  | [`server/routes/bands.ts:152`](../../server/routes/bands.ts#L152) |
| `DELETE` | `/api/bands/{id}` | Sesión | — |  | [`server/routes/bands.ts:195`](../../server/routes/bands.ts#L195) |
| `GET` | `/api/response-strategies` | Sesión | — |  | [`server/routes/bands/responseStrategies.ts:50`](../../server/routes/bands/responseStrategies.ts#L50) |
| `POST` | `/api/response-strategies` | Sesión | — |  | [`server/routes/bands/responseStrategies.ts:74`](../../server/routes/bands/responseStrategies.ts#L74) |
| `DELETE` | `/api/response-strategies/{responseType}` | Sesión | — |  | [`server/routes/bands/responseStrategies.ts:110`](../../server/routes/bands/responseStrategies.ts#L110) |

### billing

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/billing/confirm-success` | Sesión | — |  | [`server/routes/billing.ts:479`](../../server/routes/billing.ts#L479) |
| `POST` | `/api/billing/consume-credits` | Sesión | — |  | [`server/routes/billing.ts:888`](../../server/routes/billing.ts#L888) |
| `POST` | `/api/billing/create-checkout-session` | Sesión | — |  | [`server/routes/billing.ts:551`](../../server/routes/billing.ts#L551) |
| `POST` | `/api/billing/create-portal-session` | Sesión | — |  | [`server/routes/billing.ts:665`](../../server/routes/billing.ts#L665) |
| `GET` | `/api/billing/credits-status` | Sesión | — |  | [`server/routes/billing.ts:956`](../../server/routes/billing.ts#L956) |
| `POST` | `/api/billing/webhook` | Firma o secreto | — |  | [`server/routes/billing.ts:987`](../../server/routes/billing.ts#L987) |
| `POST` | `/api/stripe/confirm-success` | Sesión | — |  | [`server/routes/billing.ts:479`](../../server/routes/billing.ts#L479) |
| `POST` | `/api/stripe/consume-credits` | Sesión | — |  | [`server/routes/billing.ts:888`](../../server/routes/billing.ts#L888) |
| `POST` | `/api/stripe/create-checkout-session` | Sesión | — |  | [`server/routes/billing.ts:551`](../../server/routes/billing.ts#L551) |
| `POST` | `/api/stripe/create-portal-session` | Sesión | — |  | [`server/routes/billing.ts:665`](../../server/routes/billing.ts#L665) |
| `GET` | `/api/stripe/credits-status` | Sesión | — |  | [`server/routes/billing.ts:956`](../../server/routes/billing.ts#L956) |
| `POST` | `/api/stripe/webhook` | Firma o secreto | — |  | [`server/routes/billing.ts:988`](../../server/routes/billing.ts#L988) |

### campaigns

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/campaigns` | Sesión | apiAutenticadaRateLimiter |  | [`server/routes/campaigns.ts:22`](../../server/routes/campaigns.ts#L22) |
| `POST` | `/api/campaigns` | Sesión | apiAutenticadaRateLimiter |  | [`server/routes/campaigns.ts:35`](../../server/routes/campaigns.ts#L35) |
| `POST` | `/api/campaigns/active` | Sesión | apiAutenticadaRateLimiter |  | [`server/routes/campaigns.ts:93`](../../server/routes/campaigns.ts#L93) |
| `PUT` | `/api/campaigns/{id}` | Sesión | apiAutenticadaRateLimiter |  | [`server/routes/campaigns.ts:59`](../../server/routes/campaigns.ts#L59) |
| `DELETE` | `/api/campaigns/{id}` | Sesión | apiAutenticadaRateLimiter |  | [`server/routes/campaigns.ts:79`](../../server/routes/campaigns.ts#L79) |
| `POST` | `/api/campaigns/{id}/record-training` | Sesión | apiAutenticadaRateLimiter |  | [`server/routes/campaigns.ts:118`](../../server/routes/campaigns.ts#L118) |
| `POST` | `/api/campaigns/{id}/train-tone-dna` | Sesión | apiAutenticadaRateLimiter |  | [`server/routes/campaigns.ts:150`](../../server/routes/campaigns.ts#L150) |

### campanaConcierto

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/campana-concierto/redactar` | Sesión | iaRateLimiter |  | [`server/routes/campanaConcierto.ts:102`](../../server/routes/campanaConcierto.ts#L102) |

### chat

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/chat` | Sesión | chatRateLimiter |  | [`server/routes/chat.ts:29`](../../server/routes/chat.ts#L29) |
| `POST` | `/api/write-reels-copy` | Sesión | iaRateLimiter |  | [`server/routes/chat.ts:642`](../../server/routes/chat.ts#L642) |

### concert_to_album

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/concert-to-album/analyze` | Sesión | ficherosRateLimiter |  | [`server/routes/concert_to_album.ts:452`](../../server/routes/concert_to_album.ts#L452) |
| `POST` | `/api/concert-to-album/classify-tracks` | Sesión | ficherosRateLimiter |  | [`server/routes/concert_to_album.ts:1379`](../../server/routes/concert_to_album.ts#L1379) |
| `GET` | `/api/concert-to-album/cookies-status` | Sesión | ficherosRateLimiter |  | [`server/routes/concert_to_album.ts:223`](../../server/routes/concert_to_album.ts#L223) |
| `POST` | `/api/concert-to-album/delete-cookies` | Sesión | ficherosRateLimiter |  | [`server/routes/concert_to_album.ts:264`](../../server/routes/concert_to_album.ts#L264) |
| `POST` | `/api/concert-to-album/demo-audio` | Sesión | ficherosRateLimiter |  | [`server/routes/concert_to_album.ts:1571`](../../server/routes/concert_to_album.ts#L1571) |
| `POST` | `/api/concert-to-album/detect-cues` | Sesión | ficherosRateLimiter |  | [`server/routes/concert_to_album.ts:1010`](../../server/routes/concert_to_album.ts#L1010) |
| `POST` | `/api/concert-to-album/preview-snippet` | Sesión | ficherosRateLimiter |  | [`server/routes/concert_to_album.ts:1349`](../../server/routes/concert_to_album.ts#L1349) |
| `POST` | `/api/concert-to-album/process` | Sesión | ficherosRateLimiter |  | [`server/routes/concert_to_album.ts:756`](../../server/routes/concert_to_album.ts#L756) |
| `POST` | `/api/concert-to-album/save-cookies` | Sesión | ficherosRateLimiter |  | [`server/routes/concert_to_album.ts:240`](../../server/routes/concert_to_album.ts#L240) |
| `POST` | `/api/concert-to-album/transcribe-song` | Sesión | ficherosRateLimiter |  | [`server/routes/concert_to_album.ts:1487`](../../server/routes/concert_to_album.ts#L1487) |
| `POST` | `/api/concert-to-album/transcribe-speech` | Sesión | ficherosRateLimiter |  | [`server/routes/concert_to_album.ts:1292`](../../server/routes/concert_to_album.ts#L1292) |

### concerts

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/calendar-feed-url` | Sesión | — |  | [`server/routes/concerts.ts:417`](../../server/routes/concerts.ts#L417) |
| `GET` | `/api/calendar.ics` | Firma o secreto | — |  | [`server/routes/concerts.ts:443`](../../server/routes/concerts.ts#L443) |
| `GET` | `/api/calendar/conflicts` | Sesión | — |  | [`server/routes/concerts.ts:58`](../../server/routes/concerts.ts#L58) |
| `POST` | `/api/concerts` | Sesión | — |  | [`server/routes/concerts.ts:181`](../../server/routes/concerts.ts#L181) |
| `POST` | `/api/concerts/sync` | Sesión | — |  | [`server/routes/concerts.ts:238`](../../server/routes/concerts.ts#L238) |
| `PUT` | `/api/concerts/{id}` | Sesión | — |  | [`server/routes/concerts.ts:155`](../../server/routes/concerts.ts#L155) |
| `DELETE` | `/api/concerts/{id}` | Sesión | — |  | [`server/routes/concerts.ts:204`](../../server/routes/concerts.ts#L204) |
| `GET` | `/api/logistics` | Sesión | — |  | [`server/routes/concerts.ts:262`](../../server/routes/concerts.ts#L262) |
| `POST` | `/api/logistics/gear` | Sesión | — |  | [`server/routes/concerts.ts:312`](../../server/routes/concerts.ts#L312) |
| `POST` | `/api/logistics/runofshow` | Sesión | — |  | [`server/routes/concerts.ts:285`](../../server/routes/concerts.ts#L285) |
| `POST` | `/api/messages` | Sesión | — |  | [`server/routes/concerts.ts:407`](../../server/routes/concerts.ts#L407) |
| `GET` | `/api/payments` | Sesión + líder | — |  | [`server/routes/concerts.ts:339`](../../server/routes/concerts.ts#L339) |
| `POST` | `/api/payments` | Sesión + líder | — |  | [`server/routes/concerts.ts:351`](../../server/routes/concerts.ts#L351) |
| `POST` | `/api/payments/sync` | Sesión + líder | — |  | [`server/routes/concerts.ts:383`](../../server/routes/concerts.ts#L383) |
| `PUT` | `/api/payments/{id}` | Sesión + líder | — |  | [`server/routes/concerts.ts:364`](../../server/routes/concerts.ts#L364) |
| `POST` | `/api/rehearsals` | Sesión | — |  | [`server/routes/concerts.ts:98`](../../server/routes/concerts.ts#L98) |
| `PUT` | `/api/rehearsals/{id}` | Sesión | — |  | [`server/routes/concerts.ts:72`](../../server/routes/concerts.ts#L72) |
| `DELETE` | `/api/rehearsals/{id}` | Sesión | — |  | [`server/routes/concerts.ts:121`](../../server/routes/concerts.ts#L121) |

### deals

Acuerdos de concierto: vista pública por token y firma.

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/deals` | Sesión | — |  | [`server/routes/deals.ts:69`](../../server/routes/deals.ts#L69) |
| `POST` | `/api/deals` | Sesión | — |  | [`server/routes/deals.ts:149`](../../server/routes/deals.ts#L149) |
| `GET` | `/api/deals/lead/{leadId}` | Sesión | — |  | [`server/routes/deals.ts:127`](../../server/routes/deals.ts#L127) |
| `GET` | `/api/public/deals/{token}` | Pública | — |  | [`server/routes/deals.ts:225`](../../server/routes/deals.ts#L225) |
| `POST` | `/api/public/deals/{token}/resend-email` | Pública | reenvioEmailRateLimiter |  | [`server/routes/deals.ts:452`](../../server/routes/deals.ts#L452) |
| `POST` | `/api/public/deals/{token}/sign` | Pública | — | ★ | [`server/routes/deals.ts:305`](../../server/routes/deals.ts#L305) |

### donations

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/donations/create-checkout-session` | Sesión | donationRateLimiter |  | [`server/routes/donations.ts:84`](../../server/routes/donations.ts#L84) |
| `GET` | `/api/donations/deal-support` | Sesión | — |  | [`server/routes/donations.ts:153`](../../server/routes/donations.ts#L153) |
| `POST` | `/api/donations/deal-support/create-checkout-session` | Sesión | donationRateLimiter |  | [`server/routes/donations.ts:184`](../../server/routes/donations.ts#L184) |
| `GET` | `/api/donations/status` | Sesión | — |  | [`server/routes/donations.ts:46`](../../server/routes/donations.ts#L46) |

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
| `PUT` | `/api/autonomy` | Sesión | — |  | [`server/routes/epk_fans.ts:105`](../../server/routes/epk_fans.ts#L105) |
| `GET` | `/api/epk` | Sesión | — |  | [`server/routes/epk_fans.ts:142`](../../server/routes/epk_fans.ts#L142) |
| `PUT` | `/api/epk` | Sesión | — |  | [`server/routes/epk_fans.ts:162`](../../server/routes/epk_fans.ts#L162) |
| `GET` | `/api/epk/clicks` | Sesión | — |  | [`server/routes/epk_fans.ts:1080`](../../server/routes/epk_fans.ts#L1080) |
| `POST` | `/api/epk/traducir` | Sesión | — |  | [`server/routes/epk_fans.ts:240`](../../server/routes/epk_fans.ts#L240) |
| `GET` | `/api/fans` | Sesión | — |  | [`server/routes/epk_fans.ts:770`](../../server/routes/epk_fans.ts#L770) |
| `POST` | `/api/fans` | Sesión | — |  | [`server/routes/epk_fans.ts:789`](../../server/routes/epk_fans.ts#L789) |
| `PATCH` | `/api/fans/{id}` | Sesión | — |  | [`server/routes/epk_fans.ts:828`](../../server/routes/epk_fans.ts#L828) |
| `DELETE` | `/api/fans/{id}` | Sesión | — |  | [`server/routes/epk_fans.ts:862`](../../server/routes/epk_fans.ts#L862) |
| `GET` | `/api/musicians-waitlist` | Sesión | — |  | [`server/routes/epk_fans.ts:1190`](../../server/routes/epk_fans.ts#L1190) |
| `GET` | `/api/public/epk` | Pública | — |  | [`server/routes/epk_fans.ts:471`](../../server/routes/epk_fans.ts#L471) |
| `POST` | `/api/public/fans` | Pública | publicoRateLimiter | ★ | [`server/routes/epk_fans.ts:876`](../../server/routes/epk_fans.ts#L876) |
| `POST` | `/api/public/musicians-waitlist` | Pública | publicoRateLimiter |  | [`server/routes/epk_fans.ts:1122`](../../server/routes/epk_fans.ts#L1122) |
| `POST` | `/api/public/track-click` | Pública | publicoRateLimiter |  | [`server/routes/epk_fans.ts:988`](../../server/routes/epk_fans.ts#L988) |

### gmailOAuth

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/gmail-oauth/authorize-url` | Sesión | gmailOAuthRateLimiter |  | [`server/routes/gmailOAuth.ts:127`](../../server/routes/gmailOAuth.ts#L127) |
| `GET` | `/api/gmail-oauth/callback` | Pública | gmailOAuthRateLimiter |  | [`server/routes/gmailOAuth.ts:159`](../../server/routes/gmailOAuth.ts#L159) |
| `POST` | `/api/gmail-oauth/disconnect` | Sesión | gmailOAuthRateLimiter |  | [`server/routes/gmailOAuth.ts:285`](../../server/routes/gmailOAuth.ts#L285) |
| `GET` | `/api/gmail-oauth/status` | Sesión | gmailOAuthRateLimiter |  | [`server/routes/gmailOAuth.ts:272`](../../server/routes/gmailOAuth.ts#L272) |

### leads

Salas, festivales y contactos del CRM de booking. Los agentes (Scout, Redactor, Enviador, Lector) trabajan sobre estos registros; la aprobación es un cambio de `estado`.

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/ai/providers` | Sesión | apiAutenticadaRateLimiter |  | [`server/routes/leads/crud.ts:25`](../../server/routes/leads/crud.ts#L25) |
| `POST` | `/api/batch-enrich-campaign` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:955`](../../server/routes/leads/enrichment.ts#L955) |
| `POST` | `/api/campaign-mass-search` | Sesión | — |  | [`server/routes/leads/places.ts:413`](../../server/routes/leads/places.ts#L413) |
| `POST` | `/api/detect-all-dates` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:878`](../../server/routes/leads/enrichment.ts#L878) |
| `GET` | `/api/example-threads` | Sesión | — |  | [`server/routes/leads/exampleThreads.ts:31`](../../server/routes/leads/exampleThreads.ts#L31) |
| `POST` | `/api/example-threads` | Sesión | — |  | [`server/routes/leads/exampleThreads.ts:44`](../../server/routes/leads/exampleThreads.ts#L44) |
| `PUT` | `/api/example-threads/{id}` | Sesión | — |  | [`server/routes/leads/exampleThreads.ts:76`](../../server/routes/leads/exampleThreads.ts#L76) |
| `DELETE` | `/api/example-threads/{id}` | Sesión | — |  | [`server/routes/leads/exampleThreads.ts:101`](../../server/routes/leads/exampleThreads.ts#L101) |
| `POST` | `/api/extract-emails` | Sesión | — |  | [`server/routes/leads/places.ts:822`](../../server/routes/leads/places.ts#L822) |
| `POST` | `/api/generate-simulated-email` | Sesión | — |  | [`server/routes/leads/simulation.ts:10`](../../server/routes/leads/simulation.ts#L10) |
| `POST` | `/api/import-excel` | Sesión | — |  | [`server/routes/leads/import.ts:13`](../../server/routes/leads/import.ts#L13) |
| `POST` | `/api/import-places` | Sesión | — |  | [`server/routes/leads/places.ts:955`](../../server/routes/leads/places.ts#L955) |
| `GET` | `/api/leads` | Sesión | apiAutenticadaRateLimiter | ★ | [`server/routes/leads/crud.ts:42`](../../server/routes/leads/crud.ts#L42) |
| `POST` | `/api/leads` | Sesión | apiAutenticadaRateLimiter | ★ | [`server/routes/leads/crud.ts:207`](../../server/routes/leads/crud.ts#L207) |
| `POST` | `/api/leads/ai-lookup` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:216`](../../server/routes/leads/enrichment.ts#L216) |
| `POST` | `/api/leads/audit-pitch` | Sesión | — |  | [`server/routes/leads/pitch.ts:15`](../../server/routes/leads/pitch.ts#L15) |
| `POST` | `/api/leads/batch-enrich-campaign` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:955`](../../server/routes/leads/enrichment.ts#L955) |
| `POST` | `/api/leads/bulk-delete` | Sesión | apiAutenticadaRateLimiter |  | [`server/routes/leads/crud.ts:339`](../../server/routes/leads/crud.ts#L339) |
| `POST` | `/api/leads/campaign-mass-search` | Sesión | — |  | [`server/routes/leads/places.ts:413`](../../server/routes/leads/places.ts#L413) |
| `POST` | `/api/leads/detect-all-dates` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:878`](../../server/routes/leads/enrichment.ts#L878) |
| `POST` | `/api/leads/enrich-addresses` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:620`](../../server/routes/leads/enrichment.ts#L620) |
| `POST` | `/api/leads/enrich-all-band` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:452`](../../server/routes/leads/enrichment.ts#L452) |
| `POST` | `/api/leads/enrich-lead` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:396`](../../server/routes/leads/enrichment.ts#L396) |
| `POST` | `/api/leads/extract-emails` | Sesión | — |  | [`server/routes/leads/places.ts:822`](../../server/routes/leads/places.ts#L822) |
| `POST` | `/api/leads/import-places` | Sesión | — |  | [`server/routes/leads/places.ts:955`](../../server/routes/leads/places.ts#L955) |
| `POST` | `/api/leads/multi-source-venues` | Sesión | — |  | [`server/routes/leads/places.ts:1109`](../../server/routes/leads/places.ts#L1109) |
| `POST` | `/api/leads/places-search` | Sesión | — |  | [`server/routes/leads/places.ts:37`](../../server/routes/leads/places.ts#L37) |
| `POST` | `/api/leads/public-cultural-radar` | Sesión | — |  | [`server/routes/leads/places.ts:1173`](../../server/routes/leads/places.ts#L1173) |
| `POST` | `/api/leads/realign-headers` | Sesión | apiAutenticadaRateLimiter |  | [`server/routes/leads/crud.ts:37`](../../server/routes/leads/crud.ts#L37) |
| `POST` | `/api/leads/similar-artists-venues` | Sesión | — |  | [`server/routes/leads/places.ts:1134`](../../server/routes/leads/places.ts#L1134) |
| `POST` | `/api/leads/train-tone-dna` | Sesión | — |  | [`server/routes/leads/pitch.ts:161`](../../server/routes/leads/pitch.ts#L161) |
| `GET` | `/api/leads/{id}` | Sesión | apiAutenticadaRateLimiter | ★ | [`server/routes/leads/crud.ts:103`](../../server/routes/leads/crud.ts#L103) |
| `PUT` | `/api/leads/{id}` | Sesión | apiAutenticadaRateLimiter | ★ | [`server/routes/leads/crud.ts:138`](../../server/routes/leads/crud.ts#L138) |
| `DELETE` | `/api/leads/{id}` | Sesión | apiAutenticadaRateLimiter |  | [`server/routes/leads/crud.ts:365`](../../server/routes/leads/crud.ts#L365) |
| `POST` | `/api/leads/{id}/analyze-sentiment` | Sesión | — |  | [`server/routes/leads/reply.ts:75`](../../server/routes/leads/reply.ts#L75) |
| `POST` | `/api/leads/{id}/calculate-break-even` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1535`](../../server/routes/leads/enrichment.ts#L1535) |
| `POST` | `/api/leads/{id}/detect-dates` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:827`](../../server/routes/leads/enrichment.ts#L827) |
| `POST` | `/api/leads/{id}/enrich-all-apis` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1271`](../../server/routes/leads/enrichment.ts#L1271) |
| `POST` | `/api/leads/{id}/enrich-booking-window` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1589`](../../server/routes/leads/enrichment.ts#L1589) |
| `POST` | `/api/leads/{id}/enrich-co-booking` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1673`](../../server/routes/leads/enrichment.ts#L1673) |
| `POST` | `/api/leads/{id}/enrich-google-places` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1154`](../../server/routes/leads/enrichment.ts#L1154) |
| `POST` | `/api/leads/{id}/enrich-instagram` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1056`](../../server/routes/leads/enrichment.ts#L1056) |
| `POST` | `/api/leads/{id}/enrich-jina` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:764`](../../server/routes/leads/enrichment.ts#L764) |
| `POST` | `/api/leads/{id}/enrich-local-events` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1613`](../../server/routes/leads/enrichment.ts#L1613) |
| `POST` | `/api/leads/{id}/enrich-logistics` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1455`](../../server/routes/leads/enrichment.ts#L1455) |
| `POST` | `/api/leads/{id}/enrich-press-media` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1643`](../../server/routes/leads/enrichment.ts#L1643) |
| `POST` | `/api/leads/{id}/enrich-setlist` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1194`](../../server/routes/leads/enrichment.ts#L1194) |
| `POST` | `/api/leads/{id}/enrich-social` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1493`](../../server/routes/leads/enrichment.ts#L1493) |
| `POST` | `/api/leads/{id}/enrich-spotify` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1108`](../../server/routes/leads/enrichment.ts#L1108) |
| `POST` | `/api/leads/{id}/generate-multi-pitch` | Sesión | — |  | [`server/routes/leads/pitch.ts:34`](../../server/routes/leads/pitch.ts#L34) |
| `POST` | `/api/leads/{id}/generate-reply` | Sesión | — |  | [`server/routes/leads/reply.ts:19`](../../server/routes/leads/reply.ts#L19) |
| `GET` | `/api/leads/{id}/messages` | Sesión | apiAutenticadaRateLimiter |  | [`server/routes/leads/crud.ts:124`](../../server/routes/leads/crud.ts#L124) |
| `POST` | `/api/leads/{id}/regenerate-pitch` | Sesión | — |  | [`server/routes/leads/pitch.ts:65`](../../server/routes/leads/pitch.ts#L65) |
| `POST` | `/api/leads/{id}/regenerate-reply` | Sesión | — |  | [`server/routes/leads/reply.ts:155`](../../server/routes/leads/reply.ts#L155) |
| `POST` | `/api/leads/{id}/revert-pitch` | Sesión | — |  | [`server/routes/leads/pitch.ts:100`](../../server/routes/leads/pitch.ts#L100) |
| `POST` | `/api/leads/{id}/verify-email` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1232`](../../server/routes/leads/enrichment.ts#L1232) |
| `POST` | `/api/multi-source-venues` | Sesión | — |  | [`server/routes/leads/places.ts:1109`](../../server/routes/leads/places.ts#L1109) |
| `POST` | `/api/places-search` | Sesión | — |  | [`server/routes/leads/places.ts:37`](../../server/routes/leads/places.ts#L37) |
| `POST` | `/api/public-cultural-radar` | Sesión | — |  | [`server/routes/leads/places.ts:1173`](../../server/routes/leads/places.ts#L1173) |
| `POST` | `/api/scrape-contact` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:505`](../../server/routes/leads/enrichment.ts#L505) |
| `POST` | `/api/similar-artists-venues` | Sesión | — |  | [`server/routes/leads/places.ts:1134`](../../server/routes/leads/places.ts#L1134) |
| `GET` | `/api/templates` | Sesión | — |  | [`server/routes/leads/templates.ts:42`](../../server/routes/leads/templates.ts#L42) |
| `POST` | `/api/templates/generate-all` | Sesión | — |  | [`server/routes/leads/templates.ts:333`](../../server/routes/leads/templates.ts#L333) |
| `POST` | `/api/templates/optimize` | Sesión | — |  | [`server/routes/leads/templates.ts:236`](../../server/routes/leads/templates.ts#L236) |
| `POST` | `/api/templates/preview` | Sesión | — |  | [`server/routes/leads/templates.ts:133`](../../server/routes/leads/templates.ts#L133) |
| `POST` | `/api/templates/reset` | Sesión | — |  | [`server/routes/leads/templates.ts:582`](../../server/routes/leads/templates.ts#L582) |
| `POST` | `/api/templates/save` | Sesión | — |  | [`server/routes/leads/templates.ts:59`](../../server/routes/leads/templates.ts#L59) |
| `GET` | `/api/templates/stats` | Sesión | — |  | [`server/routes/leads/templates.ts:437`](../../server/routes/leads/templates.ts#L437) |
| `GET` | `/api/validate-emails` | Sesión | — |  | [`server/routes/leads/emailValidation.ts:15`](../../server/routes/leads/emailValidation.ts#L15) |
| `POST` | `/api/{id}/calculate-break-even` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1535`](../../server/routes/leads/enrichment.ts#L1535) |
| `POST` | `/api/{id}/detect-dates` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:827`](../../server/routes/leads/enrichment.ts#L827) |
| `POST` | `/api/{id}/enrich-all-apis` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1271`](../../server/routes/leads/enrichment.ts#L1271) |
| `POST` | `/api/{id}/enrich-booking-window` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1589`](../../server/routes/leads/enrichment.ts#L1589) |
| `POST` | `/api/{id}/enrich-co-booking` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1673`](../../server/routes/leads/enrichment.ts#L1673) |
| `POST` | `/api/{id}/enrich-google-places` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1154`](../../server/routes/leads/enrichment.ts#L1154) |
| `POST` | `/api/{id}/enrich-instagram` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1056`](../../server/routes/leads/enrichment.ts#L1056) |
| `POST` | `/api/{id}/enrich-jina` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:764`](../../server/routes/leads/enrichment.ts#L764) |
| `POST` | `/api/{id}/enrich-local-events` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1613`](../../server/routes/leads/enrichment.ts#L1613) |
| `POST` | `/api/{id}/enrich-logistics` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1455`](../../server/routes/leads/enrichment.ts#L1455) |
| `POST` | `/api/{id}/enrich-press-media` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1643`](../../server/routes/leads/enrichment.ts#L1643) |
| `POST` | `/api/{id}/enrich-setlist` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1194`](../../server/routes/leads/enrichment.ts#L1194) |
| `POST` | `/api/{id}/enrich-social` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1493`](../../server/routes/leads/enrichment.ts#L1493) |
| `POST` | `/api/{id}/enrich-spotify` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1108`](../../server/routes/leads/enrichment.ts#L1108) |
| `POST` | `/api/{id}/verify-email` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1232`](../../server/routes/leads/enrichment.ts#L1232) |

### metrics

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/generate-growth-plan` | Sesión | — |  | [`server/routes/metrics.ts:732`](../../server/routes/metrics.ts#L732) |
| `GET` | `/api/metrics` | Sesión | — |  | [`server/routes/metrics.ts:15`](../../server/routes/metrics.ts#L15) |
| `POST` | `/api/metrics` | Sesión | — |  | [`server/routes/metrics.ts:27`](../../server/routes/metrics.ts#L27) |
| `GET` | `/api/metrics/content-items` | Sesión | — |  | [`server/routes/metrics.ts:230`](../../server/routes/metrics.ts#L230) |
| `POST` | `/api/metrics/instagram/connect` | Sesión | — |  | [`server/routes/metrics.ts:462`](../../server/routes/metrics.ts#L462) |
| `POST` | `/api/metrics/instagram/disconnect` | Sesión | — |  | [`server/routes/metrics.ts:579`](../../server/routes/metrics.ts#L579) |
| `GET` | `/api/metrics/instagram/status` | Sesión | — |  | [`server/routes/metrics.ts:363`](../../server/routes/metrics.ts#L363) |
| `POST` | `/api/metrics/real` | Sesión | — |  | [`server/routes/metrics.ts:108`](../../server/routes/metrics.ts#L108) |
| `POST` | `/api/metrics/scan-screenshot` | Sesión | — |  | [`server/routes/metrics.ts:606`](../../server/routes/metrics.ts#L606) |
| `POST` | `/api/metrics/sync` | Sesión | — |  | [`server/routes/metrics.ts:80`](../../server/routes/metrics.ts#L80) |
| `PUT` | `/api/metrics/{id}` | Sesión | — |  | [`server/routes/metrics.ts:40`](../../server/routes/metrics.ts#L40) |
| `DELETE` | `/api/metrics/{id}` | Sesión + líder | — |  | [`server/routes/metrics.ts:59`](../../server/routes/metrics.ts#L59) |

### paginaConcierto

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/emails/baja` | Pública | publicoRateLimiter |  | [`server/routes/emailsCicloVida.ts:13`](../../server/routes/emailsCicloVida.ts#L13) |
| `GET` | `/e/{slug}` | Pública | publicoRateLimiter |  | [`server/routes/paginaConcierto.ts:44`](../../server/routes/paginaConcierto.ts#L44) |
| `GET` | `/robots.txt` | Pública | — |  | [`server/routes/paginaConcierto.ts:159`](../../server/routes/paginaConcierto.ts#L159) |
| `GET` | `/sitemap.xml` | Pública | publicoRateLimiter |  | [`server/routes/paginaConcierto.ts:141`](../../server/routes/paginaConcierto.ts#L141) |

### posts

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/posts` | Sesión | — |  | [`server/routes/posts.ts:21`](../../server/routes/posts.ts#L21) |
| `POST` | `/api/posts` | Sesión | — |  | [`server/routes/posts.ts:88`](../../server/routes/posts.ts#L88) |
| `POST` | `/api/posts/sync` | Sesión | — |  | [`server/routes/posts.ts:219`](../../server/routes/posts.ts#L219) |
| `POST` | `/api/posts/trigger-webhook` | Sesión | — |  | [`server/routes/posts.ts:243`](../../server/routes/posts.ts#L243) |
| `PUT` | `/api/posts/{id}` | Sesión | — |  | [`server/routes/posts.ts:33`](../../server/routes/posts.ts#L33) |
| `DELETE` | `/api/posts/{id}` | Sesión | — |  | [`server/routes/posts.ts:107`](../../server/routes/posts.ts#L107) |
| `GET` | `/api/social/accounts` | Sesión | — |  | [`server/routes/posts.ts:128`](../../server/routes/posts.ts#L128) |
| `POST` | `/api/social/accounts/connect` | Sesión | — |  | [`server/routes/posts.ts:141`](../../server/routes/posts.ts#L141) |
| `DELETE` | `/api/social/accounts/{id}` | Sesión | — |  | [`server/routes/posts.ts:173`](../../server/routes/posts.ts#L173) |
| `POST` | `/api/social/publish-now/{id}` | Sesión | — |  | [`server/routes/posts.ts:187`](../../server/routes/posts.ts#L187) |
| `POST` | `/api/social/run-scheduled-publisher` | Sesión | — |  | [`server/routes/posts.ts:206`](../../server/routes/posts.ts#L206) |

### reels

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/analyze-video-highlights` | Sesión | iaRateLimiter |  | [`server/routes/reels.ts:226`](../../server/routes/reels.ts#L226) |
| `POST` | `/api/api/reels/ai-hook-doctor` | Sesión | iaRateLimiter |  | [`server/routes/reelsTexto.ts:24`](../../server/routes/reelsTexto.ts#L24) |
| `POST` | `/api/cut-video-clip` | Sesión | renderRateLimiter, renderConcurrencyLimiter |  | [`server/routes/reels.ts:556`](../../server/routes/reels.ts#L556) |
| `POST` | `/api/reanalyze-clip` | Sesión | iaRateLimiter |  | [`server/routes/reels.ts:719`](../../server/routes/reels.ts#L719) |
| `GET` | `/api/reel-analysis` | Sesión | — |  | [`server/routes/reels.ts:188`](../../server/routes/reels.ts#L188) |
| `POST` | `/api/reels/ai-hook-doctor` | Sesión | iaRateLimiter |  | [`server/routes/reelsTexto.ts:24`](../../server/routes/reelsTexto.ts#L24) |
| `GET` | `/api/reels/aprendizaje` | Sesión | — |  | [`server/routes/reelsAprendizaje.ts:16`](../../server/routes/reelsAprendizaje.ts#L16) |
| `POST` | `/api/reels/copy-perfecto` | Sesión | iaRateLimiter |  | [`server/routes/reelsTexto.ts:55`](../../server/routes/reelsTexto.ts#L55) |
| `GET` | `/api/youtube-meta` | Sesión | — |  | [`server/routes/reels.ts:149`](../../server/routes/reels.ts#L149) |

### referidos

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/public/insignia` | Pública | publicoRateLimiter |  | [`server/routes/referidos.ts:76`](../../server/routes/referidos.ts#L76) |
| `GET` | `/api/referidos` | Sesión | — |  | [`server/routes/referidos.ts:31`](../../server/routes/referidos.ts#L31) |
| `POST` | `/api/referidos/atribuir` | Sesión | — |  | [`server/routes/referidos.ts:47`](../../server/routes/referidos.ts#L47) |

### repertorio

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/ai-composer-arrangement` | Sesión | — |  | [`server/routes/repertorio.ts:767`](../../server/routes/repertorio.ts#L767) |
| `POST` | `/api/enrich-missing-audio` | Sesión | — |  | [`server/routes/repertorio.ts:989`](../../server/routes/repertorio.ts#L989) |
| `POST` | `/api/generate-song-chords` | Sesión | — |  | [`server/routes/repertorio.ts:568`](../../server/routes/repertorio.ts#L568) |
| `PUT` | `/api/letras/auto` | Sesión | — |  | [`server/routes/repertorio.ts:318`](../../server/routes/repertorio.ts#L318) |
| `GET` | `/api/letras/cola` | Sesión | — |  | [`server/routes/repertorio.ts:290`](../../server/routes/repertorio.ts#L290) |
| `POST` | `/api/letras/cola` | Sesión | — |  | [`server/routes/repertorio.ts:299`](../../server/routes/repertorio.ts#L299) |
| `DELETE` | `/api/letras/cola` | Sesión | — |  | [`server/routes/repertorio.ts:309`](../../server/routes/repertorio.ts#L309) |
| `POST` | `/api/optimize-wavs` | Sesión | — |  | [`server/routes/repertorio.ts:975`](../../server/routes/repertorio.ts#L975) |
| `GET` | `/api/setlist-shortcuts` | Sesión | — |  | [`server/routes/repertorio.ts:521`](../../server/routes/repertorio.ts#L521) |
| `POST` | `/api/setlist-shortcuts` | Sesión | — |  | [`server/routes/repertorio.ts:534`](../../server/routes/repertorio.ts#L534) |
| `DELETE` | `/api/setlist-shortcuts/{id}` | Sesión | — |  | [`server/routes/repertorio.ts:554`](../../server/routes/repertorio.ts#L554) |
| `GET` | `/api/setlists` | Sesión | — |  | [`server/routes/repertorio.ts:449`](../../server/routes/repertorio.ts#L449) |
| `POST` | `/api/setlists` | Sesión | — |  | [`server/routes/repertorio.ts:462`](../../server/routes/repertorio.ts#L462) |
| `POST` | `/api/setlists/import-from-image` | Sesión | iaRateLimiter |  | [`server/routes/repertorio.ts:938`](../../server/routes/repertorio.ts#L938) |
| `PUT` | `/api/setlists/{id}` | Sesión | — |  | [`server/routes/repertorio.ts:488`](../../server/routes/repertorio.ts#L488) |
| `DELETE` | `/api/setlists/{id}` | Sesión | — |  | [`server/routes/repertorio.ts:506`](../../server/routes/repertorio.ts#L506) |
| `POST` | `/api/setlists/{setlistId}/analyze-with-ai` | Sesión | — |  | [`server/routes/repertorio.ts:829`](../../server/routes/repertorio.ts#L829) |
| `POST` | `/api/setlists/{setlistId}/generate-perfect-setlist` | Sesión | iaRateLimiter |  | [`server/routes/repertorio.ts:885`](../../server/routes/repertorio.ts#L885) |
| `GET` | `/api/songs` | Sesión | — |  | [`server/routes/repertorio.ts:132`](../../server/routes/repertorio.ts#L132) |
| `POST` | `/api/songs` | Sesión | — |  | [`server/routes/repertorio.ts:147`](../../server/routes/repertorio.ts#L147) |
| `PUT` | `/api/songs/{id}` | Sesión | — |  | [`server/routes/repertorio.ts:170`](../../server/routes/repertorio.ts#L170) |
| `DELETE` | `/api/songs/{id}` | Sesión | — |  | [`server/routes/repertorio.ts:434`](../../server/routes/repertorio.ts#L434) |
| `PATCH` | `/api/songs/{id}/acordes` | Sesión | — |  | [`server/routes/repertorio.ts:332`](../../server/routes/repertorio.ts#L332) |
| `POST` | `/api/songs/{id}/analizar-acordes` | Sesión | — |  | [`server/routes/repertorio.ts:246`](../../server/routes/repertorio.ts#L246) |
| `POST` | `/api/songs/{id}/analizar-dinamica` | Sesión | — |  | [`server/routes/repertorio.ts:191`](../../server/routes/repertorio.ts#L191) |
| `PATCH` | `/api/songs/{id}/energia` | Sesión | — |  | [`server/routes/repertorio.ts:416`](../../server/routes/repertorio.ts#L416) |
| `POST` | `/api/songs/{id}/letra-sincronizada` | Sesión | — |  | [`server/routes/repertorio.ts:280`](../../server/routes/repertorio.ts#L280) |
| `POST` | `/api/songs/{id}/profesor-armonia` | Sesión | — |  | [`server/routes/repertorio.ts:359`](../../server/routes/repertorio.ts#L359) |
| `GET` | `/api/songs/{id}/progreso-oido` | Sesión | — |  | [`server/routes/repertorio.ts:273`](../../server/routes/repertorio.ts#L273) |

### sistema

Salud del servicio, estado de la sesión y páginas legales servidas por server.ts.

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/download-excel` | Sesión (comprobada en el handler) | — |  | [`server.ts:269`](../../server.ts#L269) |
| `GET` | `/api/health` | Pública | — | ★ | [`server.ts:168`](../../server.ts#L168) |
| `GET` | `/api/state` | Sesión (comprobada en el handler) | — |  | [`server.ts:511`](../../server.ts#L511) |
| `GET` | `/health` | Pública | — |  | [`server.ts:168`](../../server.ts#L168) |
| `GET` | `/privacy` | Pública | — |  | [`server.ts:182`](../../server.ts#L182) |
| `GET` | `/terms` | Pública | — |  | [`server.ts:224`](../../server.ts#L224) |

### songs

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/songs/{songId}/upload-structure` | Sesión | — |  | [`server/routes/songs/structureUpload.ts:159`](../../server/routes/songs/structureUpload.ts#L159) |

### spotify

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/spotify/artist-discography` | Sesión | — |  | [`server/routes/spotify.ts:66`](../../server/routes/spotify.ts#L66) |
| `POST` | `/api/spotify/import-discography` | Sesión | — |  | [`server/routes/spotify.ts:86`](../../server/routes/spotify.ts#L86) |
| `GET` | `/api/spotify/preview` | Sesión | — |  | [`server/routes/spotify.ts:27`](../../server/routes/spotify.ts#L27) |
| `GET` | `/api/spotify/search` | Sesión | — |  | [`server/routes/spotify.ts:46`](../../server/routes/spotify.ts#L46) |
| `GET` | `/api/spotify/status` | Pública | — |  | [`server/routes/spotify.ts:14`](../../server/routes/spotify.ts#L14) |

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
| `GET` | `/api/api/tracking/click` | Pública | — |  | [`server/routes/tracking.ts:147`](../../server/routes/tracking.ts#L147) |
| `POST` | `/api/api/tracking/interaction` | Pública | — |  | [`server/routes/tracking.ts:259`](../../server/routes/tracking.ts#L259) |
| `GET` | `/api/api/tracking/open` | Pública | — |  | [`server/routes/tracking.ts:53`](../../server/routes/tracking.ts#L53) |
| `GET` | `/api/api/tracking/pdf` | Pública | — |  | [`server/routes/tracking.ts:328`](../../server/routes/tracking.ts#L328) |
| `GET` | `/api/tracking/click` | Pública | — |  | [`server/routes/tracking.ts:147`](../../server/routes/tracking.ts#L147) |
| `POST` | `/api/tracking/interaction` | Pública | — |  | [`server/routes/tracking.ts:259`](../../server/routes/tracking.ts#L259) |
| `GET` | `/api/tracking/open` | Pública | — |  | [`server/routes/tracking.ts:53`](../../server/routes/tracking.ts#L53) |
| `GET` | `/api/tracking/pdf` | Pública | — |  | [`server/routes/tracking.ts:328`](../../server/routes/tracking.ts#L328) |
| `POST` | `/api/webhooks/resend` | Firma o secreto | publicoRateLimiter |  | [`server/routes/tracking.ts:464`](../../server/routes/tracking.ts#L464) |

### transposeRoute

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/transpose-audio` | Sesión | — |  | [`server/routes/transposeRoute.ts:11`](../../server/routes/transposeRoute.ts#L11) |
| `POST` | `/transpose-audio` | Sesión | — |  | [`server/routes/transposeRoute.ts:11`](../../server/routes/transposeRoute.ts#L11) |

### upload

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/upload` | Sesión | — |  | [`server/routes/upload.ts:508`](../../server/routes/upload.ts#L508) |
| `POST` | `/api/upload/chunk` | Sesión | — |  | [`server/routes/upload.ts:646`](../../server/routes/upload.ts#L646) |
| `POST` | `/api/upload/cleanup-unused-media` | Sesión | — |  | [`server/routes/upload.ts:438`](../../server/routes/upload.ts#L438) |
| `GET` | `/api/upload/storage-stats` | Sesión | — |  | [`server/routes/upload.ts:410`](../../server/routes/upload.ts#L410) |
| `GET` | `/api/upload/test-supabase` | Sesión | — |  | [`server/routes/upload.ts:338`](../../server/routes/upload.ts#L338) |

### users

Autenticación (login, registro, Google, invitaciones, cambio de banda) y gestión de usuarios.

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/auth/activate-member` | Sesión opcional | loginRateLimiter |  | [`server/routes/users/rutasInvitacion.ts:73`](../../server/routes/users/rutasInvitacion.ts#L73) |
| `POST` | `/api/auth/check-invitation` | Pública | loginRateLimiter |  | [`server/routes/users/rutasInvitacion.ts:17`](../../server/routes/users/rutasInvitacion.ts#L17) |
| `POST` | `/api/auth/google` | Sesión (comprobada en el handler) | loginRateLimiter |  | [`server/routes/users/rutasGoogle.ts:19`](../../server/routes/users/rutasGoogle.ts#L19) |
| `POST` | `/api/auth/login` | Sesión (comprobada en el handler) | loginRateLimiter | ★ | [`server/routes/users/rutasLogin.ts:16`](../../server/routes/users/rutasLogin.ts#L16) |
| `POST` | `/api/auth/logout` | Sesión opcional | — |  | [`server/routes/users/rutasSesion.ts:321`](../../server/routes/users/rutasSesion.ts#L321) |
| `GET` | `/api/auth/me` | Sesión (comprobada en el handler) | — |  | [`server/routes/users/rutasSesion.ts:14`](../../server/routes/users/rutasSesion.ts#L14) |
| `POST` | `/api/auth/register` | Sesión opcional | registroRateLimiter |  | [`server/routes/users/rutasRegistro.ts:19`](../../server/routes/users/rutasRegistro.ts#L19) |
| `POST` | `/api/auth/reset-password/confirm` | Firma o secreto | loginRateLimiter |  | [`server/routes/users/rutasRecuperacion.ts:204`](../../server/routes/users/rutasRecuperacion.ts#L204) |
| `POST` | `/api/auth/reset-password/request` | Pública | loginRateLimiter |  | [`server/routes/users/rutasRecuperacion.ts:17`](../../server/routes/users/rutasRecuperacion.ts#L17) |
| `POST` | `/api/auth/switch-band` | Sesión (comprobada en el handler) | — |  | [`server/routes/users/rutasSesion.ts:136`](../../server/routes/users/rutasSesion.ts#L136) |
| `POST` | `/api/auth/test-email` | Sesión | — |  | [`server/routes/users/rutasRecuperacion.ts:327`](../../server/routes/users/rutasRecuperacion.ts#L327) |
| `POST` | `/api/bands/logo` | Sesión | — |  | [`server/routes/users/rutasBandas.ts:16`](../../server/routes/users/rutasBandas.ts#L16) |
| `POST` | `/api/bands/upload-logo` | Sesión | — |  | [`server/routes/users/rutasBandas.ts:16`](../../server/routes/users/rutasBandas.ts#L16) |
| `POST` | `/api/create-band` | Sesión | — |  | [`server/routes/users/rutasBandas.ts:99`](../../server/routes/users/rutasBandas.ts#L99) |
| `DELETE` | `/api/leave-band/{bandId}` | Sesión | — |  | [`server/routes/users/rutasSalidaBanda.ts:13`](../../server/routes/users/rutasSalidaBanda.ts#L13) |
| `GET` | `/api/registered-bands` | Sesión | — |  | [`server/routes/users/rutasRegistro.ts:317`](../../server/routes/users/rutasRegistro.ts#L317) |
| `POST` | `/api/set-band-order` | Sesión | — |  | [`server/routes/users/rutasPreferencias.ts:120`](../../server/routes/users/rutasPreferencias.ts#L120) |
| `POST` | `/api/set-main-band` | Sesión | — |  | [`server/routes/users/rutasPreferencias.ts:16`](../../server/routes/users/rutasPreferencias.ts#L16) |
| `GET` | `/api/ui-preferences` | Sesión | — |  | [`server/routes/users/rutasPreferencias.ts:251`](../../server/routes/users/rutasPreferencias.ts#L251) |
| `POST` | `/api/ui-preferences` | Sesión | — |  | [`server/routes/users/rutasPreferencias.ts:174`](../../server/routes/users/rutasPreferencias.ts#L174) |
| `POST` | `/api/upload-logo` | Sesión | — |  | [`server/routes/users/rutasBandas.ts:16`](../../server/routes/users/rutasBandas.ts#L16) |
| `GET` | `/api/users` | Sesión | — |  | [`server/routes/users/rutasMiembros.ts:103`](../../server/routes/users/rutasMiembros.ts#L103) |
| `POST` | `/api/users` | Sesión + líder | — |  | [`server/routes/users/rutasMiembros.ts:146`](../../server/routes/users/rutasMiembros.ts#L146) |
| `POST` | `/api/users/associate` | Sesión + líder | — |  | [`server/routes/users/rutasMiembros.ts:19`](../../server/routes/users/rutasMiembros.ts#L19) |
| `POST` | `/api/users/create-band` | Sesión | — |  | [`server/routes/users/rutasBandas.ts:99`](../../server/routes/users/rutasBandas.ts#L99) |
| `DELETE` | `/api/users/leave-band/{bandId}` | Sesión | — |  | [`server/routes/users/rutasSalidaBanda.ts:13`](../../server/routes/users/rutasSalidaBanda.ts#L13) |
| `GET` | `/api/users/registered-bands` | Sesión | — |  | [`server/routes/users/rutasRegistro.ts:318`](../../server/routes/users/rutasRegistro.ts#L318) |
| `POST` | `/api/users/set-band-order` | Sesión | — |  | [`server/routes/users/rutasPreferencias.ts:120`](../../server/routes/users/rutasPreferencias.ts#L120) |
| `POST` | `/api/users/set-main-band` | Sesión | — |  | [`server/routes/users/rutasPreferencias.ts:16`](../../server/routes/users/rutasPreferencias.ts#L16) |
| `GET` | `/api/users/ui-preferences` | Sesión | — |  | [`server/routes/users/rutasPreferencias.ts:251`](../../server/routes/users/rutasPreferencias.ts#L251) |
| `POST` | `/api/users/ui-preferences` | Sesión | — |  | [`server/routes/users/rutasPreferencias.ts:174`](../../server/routes/users/rutasPreferencias.ts#L174) |
| `POST` | `/api/users/upload-logo` | Sesión | — |  | [`server/routes/users/rutasBandas.ts:16`](../../server/routes/users/rutasBandas.ts#L16) |
| `PUT` | `/api/users/{id}` | Sesión | — |  | [`server/routes/users/rutasMiembrosEdicion.ts:15`](../../server/routes/users/rutasMiembrosEdicion.ts#L15) |
| `DELETE` | `/api/users/{id}` | Sesión + líder | — |  | [`server/routes/users/rutasMiembrosEdicion.ts:228`](../../server/routes/users/rutasMiembrosEdicion.ts#L228) |

## Avisos del análisis estático

- Sin rutas declaradas dos veces.

- Sin rutas sombreadas.

Omitidas a propósito:

- GET /* (server.ts:595): fallback de la SPA, no es API

