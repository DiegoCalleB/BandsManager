# Referencia de la API

> Generado automáticamente por `scripts/generate-openapi.mjs` a partir del código. No se edita a mano: ejecuta `npm run docs:api`.

**359 rutas HTTP** (308 declaraciones de handler; el resto son alias) en 31 dominios. Contrato máquina-legible: [`openapi.json`](./openapi.json) (OpenAPI 3.1). Visor interactivo: [`index.html`](./index.html) (hay que abrirlo en un navegador; GitHub no lo renderiza). Decisión de diseño: [ADR 0012](../adr/0012-contrato-api-openapi-por-ast.md).

## Cómo leerla

- **Acceso** es lo que el código muestra, no lo que se supone. Una ruta "Pública" es una ruta sin ninguna comprobación detectada; puede ser intencionada (login, páginas públicas) y conviene revisarla.
- **Esquema ★** significa que la petición y la respuesta están descritas a mano en [`overrides.json`](./overrides.json). El resto solo documenta la superficie (método, ruta, acceso, límites, código): el proyecto no usa una librería de validación de la que derivar esquemas.
- La banda activa se envía en la cabecera `x-band-id` y el servidor la valida contra las bandas del usuario ([ADR 0004](../adr/0004-band-id-resuelto-en-servidor.md)).

| Acceso | Rutas |
|---|---|
| Sesión | 313 |
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
| `GET` | `/api/calendar.ics` | Firma o secreto | — |  | [`server/routes/concerts.ts:438`](../../server/routes/concerts.ts#L438) |
| `GET` | `/api/download-excel` | Sesión (comprobada en el handler) | — |  | [`server.ts:269`](../../server.ts#L269) |
| `GET` | `/api/emails/baja` | Pública | publicoRateLimiter |  | [`server/routes/emailsCicloVida.ts:13`](../../server/routes/emailsCicloVida.ts#L13) |
| `GET` | `/api/gmail-oauth/callback` | Pública | gmailOAuthRateLimiter |  | [`server/routes/gmailOAuth.ts:159`](../../server/routes/gmailOAuth.ts#L159) |
| `GET` | `/api/health` | Pública | — | ★ | [`server.ts:168`](../../server.ts#L168) |
| `GET` | `/api/public/deals/{token}` | Pública | — |  | [`server/routes/deals.ts:225`](../../server/routes/deals.ts#L225) |
| `POST` | `/api/public/deals/{token}/resend-email` | Pública | reenvioEmailRateLimiter |  | [`server/routes/deals.ts:452`](../../server/routes/deals.ts#L452) |
| `POST` | `/api/public/deals/{token}/sign` | Pública | — | ★ | [`server/routes/deals.ts:305`](../../server/routes/deals.ts#L305) |
| `GET` | `/api/public/epk` | Pública | — |  | [`server/routes/epk_fans.ts:467`](../../server/routes/epk_fans.ts#L467) |
| `POST` | `/api/public/fans` | Pública | publicoRateLimiter | ★ | [`server/routes/epk_fans.ts:872`](../../server/routes/epk_fans.ts#L872) |
| `GET` | `/api/public/insignia` | Pública | publicoRateLimiter |  | [`server/routes/referidos.ts:76`](../../server/routes/referidos.ts#L76) |
| `POST` | `/api/public/musicians-waitlist` | Pública | publicoRateLimiter |  | [`server/routes/epk_fans.ts:1118`](../../server/routes/epk_fans.ts#L1118) |
| `POST` | `/api/public/track-click` | Pública | publicoRateLimiter |  | [`server/routes/epk_fans.ts:984`](../../server/routes/epk_fans.ts#L984) |
| `GET` | `/api/r/{code}` | Pública | publicoRateLimiter |  | [`server/routes/enlacesCortos.ts:49`](../../server/routes/enlacesCortos.ts#L49) |
| `GET` | `/api/spotify/status` | Pública | — |  | [`server/routes/spotify.ts:15`](../../server/routes/spotify.ts#L15) |
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
| `GET` | `/api/admin/agent-funnel` | Sesión | — |  | [`server/routes/agent.ts:1291`](../../server/routes/agent.ts#L1291) |
| `GET` | `/api/agent-logs` | Sesión | — |  | [`server/routes/agent.ts:1218`](../../server/routes/agent.ts#L1218) |
| `POST` | `/api/agent-logs` | Sesión | — |  | [`server/routes/agent.ts:1243`](../../server/routes/agent.ts#L1243) |
| `GET` | `/api/agent-runs` | Sesión | — |  | [`server/routes/agent.ts:1023`](../../server/routes/agent.ts#L1023) |
| `GET` | `/api/agent-runs/{runId}/jobs` | Sesión | — |  | [`server/routes/agent.ts:1093`](../../server/routes/agent.ts#L1093) |
| `POST` | `/api/agents/test-intel` | Sesión | — |  | [`server/routes/agent.ts:983`](../../server/routes/agent.ts#L983) |
| `POST` | `/api/internal/agents/responder-hilo` | Sesión | — |  | [`server/routes/agent.ts:940`](../../server/routes/agent.ts#L940) |
| `POST` | `/api/reset` | Sesión + líder | — |  | [`server/routes/agent.ts:1187`](../../server/routes/agent.ts#L1187) |
| `POST` | `/api/trigger-agent` | Sesión | — |  | [`server/routes/agent.ts:95`](../../server/routes/agent.ts#L95) |

### agentQueue

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/agent-queue/enqueue` | Sesión | — |  | [`server/routes/agentQueue.ts:67`](../../server/routes/agentQueue.ts#L67) |
| `GET` | `/api/agent-queue/metrics` | Sesión | — |  | [`server/routes/agentQueue.ts:37`](../../server/routes/agentQueue.ts#L37) |
| `POST` | `/api/agent-queue/prune` | Sesión | — |  | [`server/routes/agentQueue.ts:52`](../../server/routes/agentQueue.ts#L52) |
| `GET` | `/api/agent-queue/stats` | Sesión | — |  | [`server/routes/agentQueue.ts:22`](../../server/routes/agentQueue.ts#L22) |

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
| `GET` | `/api/bands` | Sesión | — |  | [`server/routes/bands.ts:92`](../../server/routes/bands.ts#L92) |
| `POST` | `/api/bands` | Sesión | — |  | [`server/routes/bands.ts:108`](../../server/routes/bands.ts#L108) |
| `POST` | `/api/bands/ai-lookup` | Sesión | — |  | [`server/routes/bands.ts:297`](../../server/routes/bands.ts#L297) |
| `POST` | `/api/bands/ai-scout` | Sesión | — |  | [`server/routes/bands.ts:235`](../../server/routes/bands.ts#L235) |
| `GET` | `/api/bands/alert-settings` | Sesión | — |  | [`server/routes/bands.ts:890`](../../server/routes/bands.ts#L890) |
| `POST` | `/api/bands/alert-settings` | Sesión | — |  | [`server/routes/bands.ts:903`](../../server/routes/bands.ts#L903) |
| `POST` | `/api/bands/analyze-tone` | Sesión | — |  | [`server/routes/bands.ts:362`](../../server/routes/bands.ts#L362) |
| `POST` | `/api/bands/bulk-delete` | Sesión | — |  | [`server/routes/bands.ts:172`](../../server/routes/bands.ts#L172) |
| `POST` | `/api/bands/email-account` | Sesión | — |  | [`server/routes/bands.ts:761`](../../server/routes/bands.ts#L761) |
| `GET` | `/api/bands/email-account/{bandId}` | Sesión | — |  | [`server/routes/bands.ts:744`](../../server/routes/bands.ts#L744) |
| `POST` | `/api/bands/generate-logo` | Sesión | iaRateLimiter |  | [`server/routes/bands.ts:1014`](../../server/routes/bands.ts#L1014) |
| `GET` | `/api/bands/print-settings` | Sesión | — |  | [`server/routes/bands.ts:921`](../../server/routes/bands.ts#L921) |
| `PUT` | `/api/bands/print-settings` | Sesión | — |  | [`server/routes/bands.ts:139`](../../server/routes/bands.ts#L139) |
| `POST` | `/api/bands/schedules` | Sesión | — |  | [`server/routes/bands.ts:716`](../../server/routes/bands.ts#L716) |
| `GET` | `/api/bands/schedules/{bandId}` | Sesión | — |  | [`server/routes/bands.ts:699`](../../server/routes/bands.ts#L699) |
| `POST` | `/api/bands/send-reminder` | Sesión | — |  | [`server/routes/bands.ts:800`](../../server/routes/bands.ts#L800) |
| `POST` | `/api/bands/sync` | Sesión | — |  | [`server/routes/bands.ts:211`](../../server/routes/bands.ts#L211) |
| `GET` | `/api/bands/tone-dna` | Sesión | — |  | [`server/routes/bands.ts:581`](../../server/routes/bands.ts#L581) |
| `PATCH` | `/api/bands/tone-dna` | Sesión | — |  | [`server/routes/bands.ts:593`](../../server/routes/bands.ts#L593) |
| `PATCH` | `/api/bands/tone-dna/learned-rules` | Sesión | — |  | [`server/routes/bands.ts:645`](../../server/routes/bands.ts#L645) |
| `POST` | `/api/bands/trigger-alert-digest` | Sesión | — |  | [`server/routes/bands.ts:934`](../../server/routes/bands.ts#L934) |
| `PUT` | `/api/bands/{id}` | Sesión | — |  | [`server/routes/bands.ts:151`](../../server/routes/bands.ts#L151) |
| `DELETE` | `/api/bands/{id}` | Sesión | — |  | [`server/routes/bands.ts:194`](../../server/routes/bands.ts#L194) |
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
| `GET` | `/api/campaigns` | Sesión | apiAutenticadaRateLimiter |  | [`server/routes/campaigns.ts:23`](../../server/routes/campaigns.ts#L23) |
| `POST` | `/api/campaigns` | Sesión | apiAutenticadaRateLimiter |  | [`server/routes/campaigns.ts:36`](../../server/routes/campaigns.ts#L36) |
| `POST` | `/api/campaigns/active` | Sesión | apiAutenticadaRateLimiter |  | [`server/routes/campaigns.ts:94`](../../server/routes/campaigns.ts#L94) |
| `PUT` | `/api/campaigns/{id}` | Sesión | apiAutenticadaRateLimiter |  | [`server/routes/campaigns.ts:60`](../../server/routes/campaigns.ts#L60) |
| `DELETE` | `/api/campaigns/{id}` | Sesión | apiAutenticadaRateLimiter |  | [`server/routes/campaigns.ts:80`](../../server/routes/campaigns.ts#L80) |
| `POST` | `/api/campaigns/{id}/record-training` | Sesión | apiAutenticadaRateLimiter |  | [`server/routes/campaigns.ts:119`](../../server/routes/campaigns.ts#L119) |
| `POST` | `/api/campaigns/{id}/train-tone-dna` | Sesión | apiAutenticadaRateLimiter |  | [`server/routes/campaigns.ts:151`](../../server/routes/campaigns.ts#L151) |

### campanaConcierto

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/campana-concierto/redactar` | Sesión | iaRateLimiter |  | [`server/routes/campanaConcierto.ts:105`](../../server/routes/campanaConcierto.ts#L105) |
| `POST` | `/api/cartel/fondo` | Sesión | imagenRateLimiter |  | [`server/routes/cartelria.ts:22`](../../server/routes/cartelria.ts#L22) |

### chat

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/chat` | Sesión | chatRateLimiter |  | [`server/routes/chat.ts:29`](../../server/routes/chat.ts#L29) |
| `POST` | `/api/write-reels-copy` | Sesión | iaRateLimiter |  | [`server/routes/chat.ts:642`](../../server/routes/chat.ts#L642) |

### concert_to_album

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/concert-to-album/analyze` | Sesión | ficherosRateLimiter |  | [`server/routes/concert_to_album.ts:451`](../../server/routes/concert_to_album.ts#L451) |
| `POST` | `/api/concert-to-album/classify-tracks` | Sesión | ficherosRateLimiter |  | [`server/routes/concert_to_album.ts:1378`](../../server/routes/concert_to_album.ts#L1378) |
| `GET` | `/api/concert-to-album/cookies-status` | Sesión | ficherosRateLimiter |  | [`server/routes/concert_to_album.ts:222`](../../server/routes/concert_to_album.ts#L222) |
| `POST` | `/api/concert-to-album/delete-cookies` | Sesión | ficherosRateLimiter |  | [`server/routes/concert_to_album.ts:263`](../../server/routes/concert_to_album.ts#L263) |
| `POST` | `/api/concert-to-album/demo-audio` | Sesión | ficherosRateLimiter |  | [`server/routes/concert_to_album.ts:1570`](../../server/routes/concert_to_album.ts#L1570) |
| `POST` | `/api/concert-to-album/detect-cues` | Sesión | ficherosRateLimiter |  | [`server/routes/concert_to_album.ts:1009`](../../server/routes/concert_to_album.ts#L1009) |
| `POST` | `/api/concert-to-album/preview-snippet` | Sesión | ficherosRateLimiter |  | [`server/routes/concert_to_album.ts:1348`](../../server/routes/concert_to_album.ts#L1348) |
| `POST` | `/api/concert-to-album/process` | Sesión | ficherosRateLimiter |  | [`server/routes/concert_to_album.ts:755`](../../server/routes/concert_to_album.ts#L755) |
| `POST` | `/api/concert-to-album/save-cookies` | Sesión | ficherosRateLimiter |  | [`server/routes/concert_to_album.ts:239`](../../server/routes/concert_to_album.ts#L239) |
| `POST` | `/api/concert-to-album/transcribe-song` | Sesión | ficherosRateLimiter |  | [`server/routes/concert_to_album.ts:1486`](../../server/routes/concert_to_album.ts#L1486) |
| `POST` | `/api/concert-to-album/transcribe-speech` | Sesión | ficherosRateLimiter |  | [`server/routes/concert_to_album.ts:1291`](../../server/routes/concert_to_album.ts#L1291) |

### concerts

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/calendar-feed-url` | Sesión | — |  | [`server/routes/concerts.ts:412`](../../server/routes/concerts.ts#L412) |
| `GET` | `/api/calendar.ics` | Firma o secreto | — |  | [`server/routes/concerts.ts:438`](../../server/routes/concerts.ts#L438) |
| `GET` | `/api/calendar/conflicts` | Sesión | — |  | [`server/routes/concerts.ts:59`](../../server/routes/concerts.ts#L59) |
| `POST` | `/api/concerts` | Sesión | — |  | [`server/routes/concerts.ts:182`](../../server/routes/concerts.ts#L182) |
| `POST` | `/api/concerts/sync` | Sesión | — |  | [`server/routes/concerts.ts:239`](../../server/routes/concerts.ts#L239) |
| `PUT` | `/api/concerts/{id}` | Sesión | — |  | [`server/routes/concerts.ts:156`](../../server/routes/concerts.ts#L156) |
| `DELETE` | `/api/concerts/{id}` | Sesión | — |  | [`server/routes/concerts.ts:205`](../../server/routes/concerts.ts#L205) |
| `GET` | `/api/logistics` | Sesión | — |  | [`server/routes/concerts.ts:260`](../../server/routes/concerts.ts#L260) |
| `POST` | `/api/logistics/gear` | Sesión | — |  | [`server/routes/concerts.ts:310`](../../server/routes/concerts.ts#L310) |
| `POST` | `/api/logistics/runofshow` | Sesión | — |  | [`server/routes/concerts.ts:283`](../../server/routes/concerts.ts#L283) |
| `POST` | `/api/messages` | Sesión | — |  | [`server/routes/concerts.ts:402`](../../server/routes/concerts.ts#L402) |
| `GET` | `/api/payments` | Sesión + líder | — |  | [`server/routes/concerts.ts:337`](../../server/routes/concerts.ts#L337) |
| `POST` | `/api/payments` | Sesión + líder | — |  | [`server/routes/concerts.ts:349`](../../server/routes/concerts.ts#L349) |
| `POST` | `/api/payments/sync` | Sesión + líder | — |  | [`server/routes/concerts.ts:381`](../../server/routes/concerts.ts#L381) |
| `PUT` | `/api/payments/{id}` | Sesión + líder | — |  | [`server/routes/concerts.ts:362`](../../server/routes/concerts.ts#L362) |
| `POST` | `/api/rehearsals` | Sesión | — |  | [`server/routes/concerts.ts:99`](../../server/routes/concerts.ts#L99) |
| `PUT` | `/api/rehearsals/{id}` | Sesión | — |  | [`server/routes/concerts.ts:73`](../../server/routes/concerts.ts#L73) |
| `DELETE` | `/api/rehearsals/{id}` | Sesión | — |  | [`server/routes/concerts.ts:122`](../../server/routes/concerts.ts#L122) |

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
| `GET` | `/api/autonomy` | Sesión | — |  | [`server/routes/epk_fans.ts:59`](../../server/routes/epk_fans.ts#L59) |
| `POST` | `/api/autonomy` | Sesión | — |  | [`server/routes/epk_fans.ts:77`](../../server/routes/epk_fans.ts#L77) |
| `PUT` | `/api/autonomy` | Sesión | — |  | [`server/routes/epk_fans.ts:108`](../../server/routes/epk_fans.ts#L108) |
| `GET` | `/api/epk` | Sesión | — |  | [`server/routes/epk_fans.ts:142`](../../server/routes/epk_fans.ts#L142) |
| `PUT` | `/api/epk` | Sesión | — |  | [`server/routes/epk_fans.ts:162`](../../server/routes/epk_fans.ts#L162) |
| `GET` | `/api/epk/clicks` | Sesión | — |  | [`server/routes/epk_fans.ts:1076`](../../server/routes/epk_fans.ts#L1076) |
| `POST` | `/api/epk/traducir` | Sesión | — |  | [`server/routes/epk_fans.ts:238`](../../server/routes/epk_fans.ts#L238) |
| `GET` | `/api/fans` | Sesión | — |  | [`server/routes/epk_fans.ts:766`](../../server/routes/epk_fans.ts#L766) |
| `POST` | `/api/fans` | Sesión | — |  | [`server/routes/epk_fans.ts:785`](../../server/routes/epk_fans.ts#L785) |
| `PATCH` | `/api/fans/{id}` | Sesión | — |  | [`server/routes/epk_fans.ts:824`](../../server/routes/epk_fans.ts#L824) |
| `DELETE` | `/api/fans/{id}` | Sesión | — |  | [`server/routes/epk_fans.ts:858`](../../server/routes/epk_fans.ts#L858) |
| `GET` | `/api/musicians-waitlist` | Sesión | — |  | [`server/routes/epk_fans.ts:1186`](../../server/routes/epk_fans.ts#L1186) |
| `GET` | `/api/public/epk` | Pública | — |  | [`server/routes/epk_fans.ts:467`](../../server/routes/epk_fans.ts#L467) |
| `POST` | `/api/public/fans` | Pública | publicoRateLimiter | ★ | [`server/routes/epk_fans.ts:872`](../../server/routes/epk_fans.ts#L872) |
| `POST` | `/api/public/musicians-waitlist` | Pública | publicoRateLimiter |  | [`server/routes/epk_fans.ts:1118`](../../server/routes/epk_fans.ts#L1118) |
| `POST` | `/api/public/track-click` | Pública | publicoRateLimiter |  | [`server/routes/epk_fans.ts:984`](../../server/routes/epk_fans.ts#L984) |

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
| `GET` | `/api/ai/providers` | Sesión | apiAutenticadaRateLimiter |  | [`server/routes/leads/crud.ts:26`](../../server/routes/leads/crud.ts#L26) |
| `POST` | `/api/batch-enrich-campaign` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:953`](../../server/routes/leads/enrichment.ts#L953) |
| `POST` | `/api/campaign-mass-search` | Sesión | — |  | [`server/routes/leads/places.ts:414`](../../server/routes/leads/places.ts#L414) |
| `POST` | `/api/detect-all-dates` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:876`](../../server/routes/leads/enrichment.ts#L876) |
| `GET` | `/api/example-threads` | Sesión | — |  | [`server/routes/leads/exampleThreads.ts:32`](../../server/routes/leads/exampleThreads.ts#L32) |
| `POST` | `/api/example-threads` | Sesión | — |  | [`server/routes/leads/exampleThreads.ts:45`](../../server/routes/leads/exampleThreads.ts#L45) |
| `PUT` | `/api/example-threads/{id}` | Sesión | — |  | [`server/routes/leads/exampleThreads.ts:77`](../../server/routes/leads/exampleThreads.ts#L77) |
| `DELETE` | `/api/example-threads/{id}` | Sesión | — |  | [`server/routes/leads/exampleThreads.ts:102`](../../server/routes/leads/exampleThreads.ts#L102) |
| `POST` | `/api/extract-emails` | Sesión | — |  | [`server/routes/leads/places.ts:823`](../../server/routes/leads/places.ts#L823) |
| `POST` | `/api/generate-simulated-email` | Sesión | — |  | [`server/routes/leads/simulation.ts:10`](../../server/routes/leads/simulation.ts#L10) |
| `POST` | `/api/import-excel` | Sesión | — |  | [`server/routes/leads/import.ts:14`](../../server/routes/leads/import.ts#L14) |
| `POST` | `/api/import-places` | Sesión | — |  | [`server/routes/leads/places.ts:956`](../../server/routes/leads/places.ts#L956) |
| `GET` | `/api/leads` | Sesión | apiAutenticadaRateLimiter | ★ | [`server/routes/leads/crud.ts:43`](../../server/routes/leads/crud.ts#L43) |
| `POST` | `/api/leads` | Sesión | apiAutenticadaRateLimiter | ★ | [`server/routes/leads/crud.ts:208`](../../server/routes/leads/crud.ts#L208) |
| `POST` | `/api/leads/ai-lookup` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:217`](../../server/routes/leads/enrichment.ts#L217) |
| `POST` | `/api/leads/audit-pitch` | Sesión | — |  | [`server/routes/leads/pitch.ts:16`](../../server/routes/leads/pitch.ts#L16) |
| `POST` | `/api/leads/batch-enrich-campaign` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:953`](../../server/routes/leads/enrichment.ts#L953) |
| `POST` | `/api/leads/bulk-delete` | Sesión | apiAutenticadaRateLimiter |  | [`server/routes/leads/crud.ts:340`](../../server/routes/leads/crud.ts#L340) |
| `POST` | `/api/leads/campaign-mass-search` | Sesión | — |  | [`server/routes/leads/places.ts:414`](../../server/routes/leads/places.ts#L414) |
| `POST` | `/api/leads/detect-all-dates` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:876`](../../server/routes/leads/enrichment.ts#L876) |
| `POST` | `/api/leads/enrich-addresses` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:618`](../../server/routes/leads/enrichment.ts#L618) |
| `POST` | `/api/leads/enrich-all-band` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:450`](../../server/routes/leads/enrichment.ts#L450) |
| `POST` | `/api/leads/enrich-lead` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:397`](../../server/routes/leads/enrichment.ts#L397) |
| `POST` | `/api/leads/extract-emails` | Sesión | — |  | [`server/routes/leads/places.ts:823`](../../server/routes/leads/places.ts#L823) |
| `POST` | `/api/leads/import-places` | Sesión | — |  | [`server/routes/leads/places.ts:956`](../../server/routes/leads/places.ts#L956) |
| `POST` | `/api/leads/multi-source-venues` | Sesión | — |  | [`server/routes/leads/places.ts:1110`](../../server/routes/leads/places.ts#L1110) |
| `POST` | `/api/leads/places-search` | Sesión | — |  | [`server/routes/leads/places.ts:38`](../../server/routes/leads/places.ts#L38) |
| `POST` | `/api/leads/public-cultural-radar` | Sesión | — |  | [`server/routes/leads/places.ts:1168`](../../server/routes/leads/places.ts#L1168) |
| `POST` | `/api/leads/realign-headers` | Sesión | apiAutenticadaRateLimiter |  | [`server/routes/leads/crud.ts:38`](../../server/routes/leads/crud.ts#L38) |
| `POST` | `/api/leads/similar-artists-venues` | Sesión | — |  | [`server/routes/leads/places.ts:1132`](../../server/routes/leads/places.ts#L1132) |
| `POST` | `/api/leads/train-tone-dna` | Sesión | — |  | [`server/routes/leads/pitch.ts:162`](../../server/routes/leads/pitch.ts#L162) |
| `GET` | `/api/leads/{id}` | Sesión | apiAutenticadaRateLimiter | ★ | [`server/routes/leads/crud.ts:104`](../../server/routes/leads/crud.ts#L104) |
| `PUT` | `/api/leads/{id}` | Sesión | apiAutenticadaRateLimiter | ★ | [`server/routes/leads/crud.ts:139`](../../server/routes/leads/crud.ts#L139) |
| `DELETE` | `/api/leads/{id}` | Sesión | apiAutenticadaRateLimiter |  | [`server/routes/leads/crud.ts:366`](../../server/routes/leads/crud.ts#L366) |
| `POST` | `/api/leads/{id}/analyze-sentiment` | Sesión | — |  | [`server/routes/leads/reply.ts:76`](../../server/routes/leads/reply.ts#L76) |
| `POST` | `/api/leads/{id}/calculate-break-even` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1533`](../../server/routes/leads/enrichment.ts#L1533) |
| `POST` | `/api/leads/{id}/detect-dates` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:825`](../../server/routes/leads/enrichment.ts#L825) |
| `POST` | `/api/leads/{id}/enrich-all-apis` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1269`](../../server/routes/leads/enrichment.ts#L1269) |
| `POST` | `/api/leads/{id}/enrich-booking-window` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1587`](../../server/routes/leads/enrichment.ts#L1587) |
| `POST` | `/api/leads/{id}/enrich-co-booking` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1671`](../../server/routes/leads/enrichment.ts#L1671) |
| `POST` | `/api/leads/{id}/enrich-google-places` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1152`](../../server/routes/leads/enrichment.ts#L1152) |
| `POST` | `/api/leads/{id}/enrich-instagram` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1054`](../../server/routes/leads/enrichment.ts#L1054) |
| `POST` | `/api/leads/{id}/enrich-jina` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:762`](../../server/routes/leads/enrichment.ts#L762) |
| `POST` | `/api/leads/{id}/enrich-local-events` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1611`](../../server/routes/leads/enrichment.ts#L1611) |
| `POST` | `/api/leads/{id}/enrich-logistics` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1453`](../../server/routes/leads/enrichment.ts#L1453) |
| `POST` | `/api/leads/{id}/enrich-press-media` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1641`](../../server/routes/leads/enrichment.ts#L1641) |
| `POST` | `/api/leads/{id}/enrich-setlist` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1192`](../../server/routes/leads/enrichment.ts#L1192) |
| `POST` | `/api/leads/{id}/enrich-social` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1491`](../../server/routes/leads/enrichment.ts#L1491) |
| `POST` | `/api/leads/{id}/enrich-spotify` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1106`](../../server/routes/leads/enrichment.ts#L1106) |
| `POST` | `/api/leads/{id}/generate-multi-pitch` | Sesión | — |  | [`server/routes/leads/pitch.ts:35`](../../server/routes/leads/pitch.ts#L35) |
| `POST` | `/api/leads/{id}/generate-reply` | Sesión | — |  | [`server/routes/leads/reply.ts:20`](../../server/routes/leads/reply.ts#L20) |
| `GET` | `/api/leads/{id}/messages` | Sesión | apiAutenticadaRateLimiter |  | [`server/routes/leads/crud.ts:125`](../../server/routes/leads/crud.ts#L125) |
| `POST` | `/api/leads/{id}/regenerate-pitch` | Sesión | — |  | [`server/routes/leads/pitch.ts:66`](../../server/routes/leads/pitch.ts#L66) |
| `POST` | `/api/leads/{id}/regenerate-reply` | Sesión | — |  | [`server/routes/leads/reply.ts:156`](../../server/routes/leads/reply.ts#L156) |
| `POST` | `/api/leads/{id}/revert-pitch` | Sesión | — |  | [`server/routes/leads/pitch.ts:101`](../../server/routes/leads/pitch.ts#L101) |
| `POST` | `/api/leads/{id}/verify-email` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1230`](../../server/routes/leads/enrichment.ts#L1230) |
| `POST` | `/api/multi-source-venues` | Sesión | — |  | [`server/routes/leads/places.ts:1110`](../../server/routes/leads/places.ts#L1110) |
| `POST` | `/api/places-search` | Sesión | — |  | [`server/routes/leads/places.ts:38`](../../server/routes/leads/places.ts#L38) |
| `POST` | `/api/public-cultural-radar` | Sesión | — |  | [`server/routes/leads/places.ts:1168`](../../server/routes/leads/places.ts#L1168) |
| `POST` | `/api/scrape-contact` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:503`](../../server/routes/leads/enrichment.ts#L503) |
| `POST` | `/api/similar-artists-venues` | Sesión | — |  | [`server/routes/leads/places.ts:1132`](../../server/routes/leads/places.ts#L1132) |
| `GET` | `/api/templates` | Sesión | — |  | [`server/routes/leads/templates.ts:43`](../../server/routes/leads/templates.ts#L43) |
| `POST` | `/api/templates/generate-all` | Sesión | — |  | [`server/routes/leads/templates.ts:328`](../../server/routes/leads/templates.ts#L328) |
| `POST` | `/api/templates/optimize` | Sesión | — |  | [`server/routes/leads/templates.ts:234`](../../server/routes/leads/templates.ts#L234) |
| `POST` | `/api/templates/preview` | Sesión | — |  | [`server/routes/leads/templates.ts:134`](../../server/routes/leads/templates.ts#L134) |
| `POST` | `/api/templates/reset` | Sesión | — |  | [`server/routes/leads/templates.ts:569`](../../server/routes/leads/templates.ts#L569) |
| `POST` | `/api/templates/save` | Sesión | — |  | [`server/routes/leads/templates.ts:60`](../../server/routes/leads/templates.ts#L60) |
| `GET` | `/api/templates/stats` | Sesión | — |  | [`server/routes/leads/templates.ts:427`](../../server/routes/leads/templates.ts#L427) |
| `GET` | `/api/validate-emails` | Sesión | — |  | [`server/routes/leads/emailValidation.ts:16`](../../server/routes/leads/emailValidation.ts#L16) |
| `POST` | `/api/{id}/calculate-break-even` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1533`](../../server/routes/leads/enrichment.ts#L1533) |
| `POST` | `/api/{id}/detect-dates` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:825`](../../server/routes/leads/enrichment.ts#L825) |
| `POST` | `/api/{id}/enrich-all-apis` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1269`](../../server/routes/leads/enrichment.ts#L1269) |
| `POST` | `/api/{id}/enrich-booking-window` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1587`](../../server/routes/leads/enrichment.ts#L1587) |
| `POST` | `/api/{id}/enrich-co-booking` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1671`](../../server/routes/leads/enrichment.ts#L1671) |
| `POST` | `/api/{id}/enrich-google-places` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1152`](../../server/routes/leads/enrichment.ts#L1152) |
| `POST` | `/api/{id}/enrich-instagram` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1054`](../../server/routes/leads/enrichment.ts#L1054) |
| `POST` | `/api/{id}/enrich-jina` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:762`](../../server/routes/leads/enrichment.ts#L762) |
| `POST` | `/api/{id}/enrich-local-events` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1611`](../../server/routes/leads/enrichment.ts#L1611) |
| `POST` | `/api/{id}/enrich-logistics` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1453`](../../server/routes/leads/enrichment.ts#L1453) |
| `POST` | `/api/{id}/enrich-press-media` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1641`](../../server/routes/leads/enrichment.ts#L1641) |
| `POST` | `/api/{id}/enrich-setlist` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1192`](../../server/routes/leads/enrichment.ts#L1192) |
| `POST` | `/api/{id}/enrich-social` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1491`](../../server/routes/leads/enrichment.ts#L1491) |
| `POST` | `/api/{id}/enrich-spotify` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1106`](../../server/routes/leads/enrichment.ts#L1106) |
| `POST` | `/api/{id}/verify-email` | Sesión | enriquecimientoRateLimiter |  | [`server/routes/leads/enrichment.ts:1230`](../../server/routes/leads/enrichment.ts#L1230) |

### metrics

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/generate-growth-plan` | Sesión | — |  | [`server/routes/metrics.ts:730`](../../server/routes/metrics.ts#L730) |
| `GET` | `/api/metrics` | Sesión | — |  | [`server/routes/metrics.ts:15`](../../server/routes/metrics.ts#L15) |
| `POST` | `/api/metrics` | Sesión | — |  | [`server/routes/metrics.ts:27`](../../server/routes/metrics.ts#L27) |
| `GET` | `/api/metrics/content-items` | Sesión | — |  | [`server/routes/metrics.ts:228`](../../server/routes/metrics.ts#L228) |
| `POST` | `/api/metrics/instagram/connect` | Sesión | — |  | [`server/routes/metrics.ts:460`](../../server/routes/metrics.ts#L460) |
| `POST` | `/api/metrics/instagram/disconnect` | Sesión | — |  | [`server/routes/metrics.ts:577`](../../server/routes/metrics.ts#L577) |
| `GET` | `/api/metrics/instagram/status` | Sesión | — |  | [`server/routes/metrics.ts:361`](../../server/routes/metrics.ts#L361) |
| `POST` | `/api/metrics/real` | Sesión | — |  | [`server/routes/metrics.ts:106`](../../server/routes/metrics.ts#L106) |
| `POST` | `/api/metrics/scan-screenshot` | Sesión | — |  | [`server/routes/metrics.ts:604`](../../server/routes/metrics.ts#L604) |
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
| `GET` | `/api/posts` | Sesión | — |  | [`server/routes/posts.ts:22`](../../server/routes/posts.ts#L22) |
| `POST` | `/api/posts` | Sesión | — |  | [`server/routes/posts.ts:89`](../../server/routes/posts.ts#L89) |
| `POST` | `/api/posts/sync` | Sesión | — |  | [`server/routes/posts.ts:219`](../../server/routes/posts.ts#L219) |
| `POST` | `/api/posts/trigger-webhook` | Sesión | — |  | [`server/routes/posts.ts:240`](../../server/routes/posts.ts#L240) |
| `PUT` | `/api/posts/{id}` | Sesión | — |  | [`server/routes/posts.ts:34`](../../server/routes/posts.ts#L34) |
| `DELETE` | `/api/posts/{id}` | Sesión | — |  | [`server/routes/posts.ts:108`](../../server/routes/posts.ts#L108) |
| `GET` | `/api/social/accounts` | Sesión | — |  | [`server/routes/posts.ts:129`](../../server/routes/posts.ts#L129) |
| `POST` | `/api/social/accounts/connect` | Sesión | — |  | [`server/routes/posts.ts:142`](../../server/routes/posts.ts#L142) |
| `DELETE` | `/api/social/accounts/{id}` | Sesión | — |  | [`server/routes/posts.ts:174`](../../server/routes/posts.ts#L174) |
| `POST` | `/api/social/publish-now/{id}` | Sesión | — |  | [`server/routes/posts.ts:188`](../../server/routes/posts.ts#L188) |
| `POST` | `/api/social/run-scheduled-publisher` | Sesión | — |  | [`server/routes/posts.ts:206`](../../server/routes/posts.ts#L206) |

### reels

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/analyze-video-highlights` | Sesión | iaRateLimiter |  | [`server/routes/reels.ts:496`](../../server/routes/reels.ts#L496) |
| `POST` | `/api/api/reels/ai-hook-doctor` | Sesión | iaRateLimiter |  | [`server/routes/reels.ts:1183`](../../server/routes/reels.ts#L1183) |
| `POST` | `/api/cut-video-clip` | Sesión | renderRateLimiter, renderConcurrencyLimiter |  | [`server/routes/reels.ts:819`](../../server/routes/reels.ts#L819) |
| `POST` | `/api/reanalyze-clip` | Sesión | iaRateLimiter |  | [`server/routes/reels.ts:1009`](../../server/routes/reels.ts#L1009) |
| `GET` | `/api/reel-analysis` | Sesión | — |  | [`server/routes/reels.ts:458`](../../server/routes/reels.ts#L458) |
| `POST` | `/api/reels/ai-hook-doctor` | Sesión | iaRateLimiter |  | [`server/routes/reels.ts:1183`](../../server/routes/reels.ts#L1183) |
| `GET` | `/api/youtube-meta` | Sesión | — |  | [`server/routes/reels.ts:419`](../../server/routes/reels.ts#L419) |

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
| `GET` | `/api/songs` | Sesión | — |  | [`server/routes/repertorio.ts:133`](../../server/routes/repertorio.ts#L133) |
| `POST` | `/api/songs` | Sesión | — |  | [`server/routes/repertorio.ts:148`](../../server/routes/repertorio.ts#L148) |
| `PUT` | `/api/songs/{id}` | Sesión | — |  | [`server/routes/repertorio.ts:171`](../../server/routes/repertorio.ts#L171) |
| `DELETE` | `/api/songs/{id}` | Sesión | — |  | [`server/routes/repertorio.ts:434`](../../server/routes/repertorio.ts#L434) |
| `PATCH` | `/api/songs/{id}/acordes` | Sesión | — |  | [`server/routes/repertorio.ts:332`](../../server/routes/repertorio.ts#L332) |
| `POST` | `/api/songs/{id}/analizar-acordes` | Sesión | — |  | [`server/routes/repertorio.ts:247`](../../server/routes/repertorio.ts#L247) |
| `POST` | `/api/songs/{id}/analizar-dinamica` | Sesión | — |  | [`server/routes/repertorio.ts:192`](../../server/routes/repertorio.ts#L192) |
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
| `GET` | `/api/spotify/artist-discography` | Sesión | — |  | [`server/routes/spotify.ts:67`](../../server/routes/spotify.ts#L67) |
| `POST` | `/api/spotify/import-discography` | Sesión | — |  | [`server/routes/spotify.ts:87`](../../server/routes/spotify.ts#L87) |
| `GET` | `/api/spotify/preview` | Sesión | — |  | [`server/routes/spotify.ts:28`](../../server/routes/spotify.ts#L28) |
| `GET` | `/api/spotify/search` | Sesión | — |  | [`server/routes/spotify.ts:47`](../../server/routes/spotify.ts#L47) |
| `GET` | `/api/spotify/status` | Pública | — |  | [`server/routes/spotify.ts:15`](../../server/routes/spotify.ts#L15) |

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
| `POST` | `/api/transpose-audio` | Sesión | — |  | [`server/routes/transposeRoute.ts:12`](../../server/routes/transposeRoute.ts#L12) |
| `POST` | `/transpose-audio` | Sesión | — |  | [`server/routes/transposeRoute.ts:12`](../../server/routes/transposeRoute.ts#L12) |

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

