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
| `GET` | `/api/api/tracking/click` | Pública | — |  | [`server/routes/tracking.ts:147`](../../server/routes/tracking.ts#L147) |
| `POST` | `/api/api/tracking/interaction` | Pública | — |  | [`server/routes/tracking.ts:259`](../../server/routes/tracking.ts#L259) |
| `GET` | `/api/api/tracking/open` | Pública | — |  | [`server/routes/tracking.ts:53`](../../server/routes/tracking.ts#L53) |
| `GET` | `/api/api/tracking/pdf` | Pública | — |  | [`server/routes/tracking.ts:328`](../../server/routes/tracking.ts#L328) |
| `POST` | `/api/api/webhooks/replicate-stems` | Firma o secreto | — |  | [`server/routes/ai_music/rutasWebhooks.ts:15`](../../server/routes/ai_music/rutasWebhooks.ts#L15) |
| `POST` | `/api/auth/activate-member` | Sesión opcional | loginRateLimiter |  | [`server/routes/users/rutasInvitacion.ts:73`](../../server/routes/users/rutasInvitacion.ts#L73) |
| `POST` | `/api/auth/check-invitation` | Pública | loginRateLimiter |  | [`server/routes/users/rutasInvitacion.ts:17`](../../server/routes/users/rutasInvitacion.ts#L17) |
| `POST` | `/api/auth/google` | Sesión (comprobada en el handler) | loginRateLimiter |  | [`server/routes/users/rutasGoogle.ts:18`](../../server/routes/users/rutasGoogle.ts#L18) |
| `POST` | `/api/auth/login` | Sesión (comprobada en el handler) | loginRateLimiter | ★ | [`server/routes/users/rutasLogin.ts:15`](../../server/routes/users/rutasLogin.ts#L15) |
| `POST` | `/api/auth/logout` | Sesión opcional | — |  | [`server/routes/users/rutasSesion.ts:320`](../../server/routes/users/rutasSesion.ts#L320) |
| `GET` | `/api/auth/me` | Sesión (comprobada en el handler) | — |  | [`server/routes/users/rutasSesion.ts:13`](../../server/routes/users/rutasSesion.ts#L13) |
| `POST` | `/api/auth/register` | Sesión opcional | registroRateLimiter |  | [`server/routes/users/rutasRegistro.ts:18`](../../server/routes/users/rutasRegistro.ts#L18) |
| `POST` | `/api/auth/reset-password/confirm` | Firma o secreto | loginRateLimiter |  | [`server/routes/users/rutasRecuperacion.ts:203`](../../server/routes/users/rutasRecuperacion.ts#L203) |
| `POST` | `/api/auth/reset-password/request` | Pública | loginRateLimiter |  | [`server/routes/users/rutasRecuperacion.ts:16`](../../server/routes/users/rutasRecuperacion.ts#L16) |
| `POST` | `/api/auth/switch-band` | Sesión (comprobada en el handler) | — |  | [`server/routes/users/rutasSesion.ts:135`](../../server/routes/users/rutasSesion.ts#L135) |
| `POST` | `/api/billing/webhook` | Firma o secreto | — |  | [`server/routes/billing.ts:986`](../../server/routes/billing.ts#L986) |
| `GET` | `/api/calendar.ics` | Firma o secreto | — |  | [`server/routes/concerts.ts:442`](../../server/routes/concerts.ts#L442) |
| `GET` | `/api/download-excel` | Sesión (comprobada en el handler) | — |  | [`server.ts:255`](../../server.ts#L255) |
| `GET` | `/api/gmail-oauth/callback` | Pública | — |  | [`server/routes/gmailOAuth.ts:151`](../../server/routes/gmailOAuth.ts#L151) |
| `GET` | `/api/health` | Pública | — | ★ | [`server.ts:166`](../../server.ts#L166) |
| `GET` | `/api/public/deals/{token}` | Pública | — |  | [`server/routes/deals.ts:213`](../../server/routes/deals.ts#L213) |
| `POST` | `/api/public/deals/{token}/resend-email` | Pública | reenvioEmailRateLimiter |  | [`server/routes/deals.ts:440`](../../server/routes/deals.ts#L440) |
| `POST` | `/api/public/deals/{token}/sign` | Pública | — | ★ | [`server/routes/deals.ts:293`](../../server/routes/deals.ts#L293) |
| `GET` | `/api/public/epk` | Pública | — |  | [`server/routes/epk_fans.ts:473`](../../server/routes/epk_fans.ts#L473) |
| `POST` | `/api/public/fans` | Pública | publicoRateLimiter | ★ | [`server/routes/epk_fans.ts:877`](../../server/routes/epk_fans.ts#L877) |
| `GET` | `/api/public/insignia` | Pública | publicoRateLimiter |  | [`server/routes/referidos.ts:76`](../../server/routes/referidos.ts#L76) |
| `POST` | `/api/public/musicians-waitlist` | Pública | publicoRateLimiter |  | [`server/routes/epk_fans.ts:1123`](../../server/routes/epk_fans.ts#L1123) |
| `POST` | `/api/public/track-click` | Pública | publicoRateLimiter |  | [`server/routes/epk_fans.ts:989`](../../server/routes/epk_fans.ts#L989) |
| `GET` | `/api/r/{code}` | Pública | publicoRateLimiter |  | [`server/routes/enlacesCortos.ts:49`](../../server/routes/enlacesCortos.ts#L49) |
| `GET` | `/api/spotify/status` | Pública | — |  | [`server/routes/spotify.ts:14`](../../server/routes/spotify.ts#L14) |
| `GET` | `/api/state` | Sesión (comprobada en el handler) | — |  | [`server.ts:497`](../../server.ts#L497) |
| `POST` | `/api/stripe/webhook` | Firma o secreto | — |  | [`server/routes/billing.ts:987`](../../server/routes/billing.ts#L987) |
| `GET` | `/api/tracking/click` | Pública | — |  | [`server/routes/tracking.ts:147`](../../server/routes/tracking.ts#L147) |
| `POST` | `/api/tracking/interaction` | Pública | — |  | [`server/routes/tracking.ts:259`](../../server/routes/tracking.ts#L259) |
| `GET` | `/api/tracking/open` | Pública | — |  | [`server/routes/tracking.ts:53`](../../server/routes/tracking.ts#L53) |
| `GET` | `/api/tracking/pdf` | Pública | — |  | [`server/routes/tracking.ts:328`](../../server/routes/tracking.ts#L328) |
| `POST` | `/api/webhooks/replicate-stems` | Firma o secreto | — |  | [`server/routes/ai_music/rutasWebhooks.ts:15`](../../server/routes/ai_music/rutasWebhooks.ts#L15) |
| `POST` | `/api/webhooks/resend` | Firma o secreto | publicoRateLimiter |  | [`server/routes/tracking.ts:464`](../../server/routes/tracking.ts#L464) |
| `GET` | `/e/{slug}` | Pública | publicoRateLimiter |  | [`server/routes/paginaConcierto.ts:39`](../../server/routes/paginaConcierto.ts#L39) |
| `GET` | `/health` | Pública | — |  | [`server.ts:166`](../../server.ts#L166) |
| `GET` | `/privacy` | Pública | — |  | [`server.ts:180`](../../server.ts#L180) |
| `GET` | `/r/{code}` | Pública | publicoRateLimiter |  | [`server/routes/enlacesCortos.ts:49`](../../server/routes/enlacesCortos.ts#L49) |
| `GET` | `/robots.txt` | Pública | — |  | [`server/routes/paginaConcierto.ts:150`](../../server/routes/paginaConcierto.ts#L150) |
| `GET` | `/sitemap.xml` | Pública | publicoRateLimiter |  | [`server/routes/paginaConcierto.ts:132`](../../server/routes/paginaConcierto.ts#L132) |
| `GET` | `/terms` | Pública | — |  | [`server.ts:222`](../../server.ts#L222) |

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
| `GET` | `/api/admin/agent-funnel` | Sesión | — |  | [`server/routes/agent.ts:1296`](../../server/routes/agent.ts#L1296) |
| `GET` | `/api/agent-logs` | Sesión | — |  | [`server/routes/agent.ts:1223`](../../server/routes/agent.ts#L1223) |
| `POST` | `/api/agent-logs` | Sesión | — |  | [`server/routes/agent.ts:1248`](../../server/routes/agent.ts#L1248) |
| `GET` | `/api/agent-runs` | Sesión | — |  | [`server/routes/agent.ts:1025`](../../server/routes/agent.ts#L1025) |
| `GET` | `/api/agent-runs/{runId}/jobs` | Sesión | — |  | [`server/routes/agent.ts:1095`](../../server/routes/agent.ts#L1095) |
| `POST` | `/api/agents/test-intel` | Sesión | — |  | [`server/routes/agent.ts:985`](../../server/routes/agent.ts#L985) |
| `POST` | `/api/internal/agents/responder-hilo` | Sesión | — |  | [`server/routes/agent.ts:940`](../../server/routes/agent.ts#L940) |
| `POST` | `/api/reset` | Sesión + líder | — |  | [`server/routes/agent.ts:1192`](../../server/routes/agent.ts#L1192) |
| `POST` | `/api/trigger-agent` | Sesión | — |  | [`server/routes/agent.ts:89`](../../server/routes/agent.ts#L89) |

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
| `GET` | `/api/ai-stem-separation/fal-diagnostic` | Sesión | — |  | [`server/routes/ai_music/rutasEstadoStems.ts:113`](../../server/routes/ai_music/rutasEstadoStems.ts#L113) |
| `GET` | `/api/ai-stem-separation/status` | Sesión | — |  | [`server/routes/ai_music/rutasEstadoStems.ts:19`](../../server/routes/ai_music/rutasEstadoStems.ts#L19) |
| `POST` | `/api/api/webhooks/replicate-stems` | Firma o secreto | — |  | [`server/routes/ai_music/rutasWebhooks.ts:15`](../../server/routes/ai_music/rutasWebhooks.ts#L15) |
| `POST` | `/api/generate` | Sesión | iaRateLimiter |  | [`server/routes/ai_music/rutasGeneracion.ts:20`](../../server/routes/ai_music/rutasGeneracion.ts#L20) |
| `POST` | `/api/generate-music` | Sesión | iaRateLimiter |  | [`server/routes/ai_music/rutasGeneracion.ts:20`](../../server/routes/ai_music/rutasGeneracion.ts#L20) |
| `POST` | `/api/webhooks/replicate-stems` | Firma o secreto | — |  | [`server/routes/ai_music/rutasWebhooks.ts:15`](../../server/routes/ai_music/rutasWebhooks.ts#L15) |

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
| `GET` | `/api/bands/alert-settings` | Sesión | — |  | [`server/routes/bands.ts:889`](../../server/routes/bands.ts#L889) |
| `POST` | `/api/bands/alert-settings` | Sesión | — |  | [`server/routes/bands.ts:902`](../../server/routes/bands.ts#L902) |
| `POST` | `/api/bands/analyze-tone` | Sesión | — |  | [`server/routes/bands.ts:363`](../../server/routes/bands.ts#L363) |
| `POST` | `/api/bands/bulk-delete` | Sesión | — |  | [`server/routes/bands.ts:173`](../../server/routes/bands.ts#L173) |
| `POST` | `/api/bands/email-account` | Sesión | — |  | [`server/routes/bands.ts:760`](../../server/routes/bands.ts#L760) |
| `GET` | `/api/bands/email-account/{bandId}` | Sesión | — |  | [`server/routes/bands.ts:743`](../../server/routes/bands.ts#L743) |
| `POST` | `/api/bands/generate-logo` | Sesión | iaRateLimiter |  | [`server/routes/bands.ts:1011`](../../server/routes/bands.ts#L1011) |
| `GET` | `/api/bands/print-settings` | Sesión | — |  | [`server/routes/bands.ts:918`](../../server/routes/bands.ts#L918) |
| `PUT` | `/api/bands/print-settings` | Sesión | — |  | [`server/routes/bands.ts:140`](../../server/routes/bands.ts#L140) |
| `POST` | `/api/bands/schedules` | Sesión | — |  | [`server/routes/bands.ts:715`](../../server/routes/bands.ts#L715) |
| `GET` | `/api/bands/schedules/{bandId}` | Sesión | — |  | [`server/routes/bands.ts:698`](../../server/routes/bands.ts#L698) |
| `POST` | `/api/bands/send-reminder` | Sesión | — |  | [`server/routes/bands.ts:799`](../../server/routes/bands.ts#L799) |
| `POST` | `/api/bands/sync` | Sesión | — |  | [`server/routes/bands.ts:212`](../../server/routes/bands.ts#L212) |
| `GET` | `/api/bands/tone-dna` | Sesión | — |  | [`server/routes/bands.ts:580`](../../server/routes/bands.ts#L580) |
| `PATCH` | `/api/bands/tone-dna` | Sesión | — |  | [`server/routes/bands.ts:592`](../../server/routes/bands.ts#L592) |
| `PATCH` | `/api/bands/tone-dna/learned-rules` | Sesión | — |  | [`server/routes/bands.ts:644`](../../server/routes/bands.ts#L644) |
| `POST` | `/api/bands/trigger-alert-digest` | Sesión | — |  | [`server/routes/bands.ts:931`](../../server/routes/bands.ts#L931) |
| `PUT` | `/api/bands/{id}` | Sesión | — |  | [`server/routes/bands.ts:152`](../../server/routes/bands.ts#L152) |
| `DELETE` | `/api/bands/{id}` | Sesión | — |  | [`server/routes/bands.ts:195`](../../server/routes/bands.ts#L195) |
| `GET` | `/api/response-strategies` | Sesión | — |  | [`server/routes/bands/responseStrategies.ts:50`](../../server/routes/bands/responseStrategies.ts#L50) |
| `POST` | `/api/response-strategies` | Sesión | — |  | [`server/routes/bands/responseStrategies.ts:74`](../../server/routes/bands/responseStrategies.ts#L74) |
| `DELETE` | `/api/response-strategies/{responseType}` | Sesión | — |  | [`server/routes/bands/responseStrategies.ts:110`](../../server/routes/bands/responseStrategies.ts#L110) |

### billing

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/billing/confirm-success` | Sesión | — |  | [`server/routes/billing.ts:476`](../../server/routes/billing.ts#L476) |
| `POST` | `/api/billing/consume-credits` | Sesión | — |  | [`server/routes/billing.ts:887`](../../server/routes/billing.ts#L887) |
| `POST` | `/api/billing/create-checkout-session` | Sesión | — |  | [`server/routes/billing.ts:548`](../../server/routes/billing.ts#L548) |
| `POST` | `/api/billing/create-portal-session` | Sesión | — |  | [`server/routes/billing.ts:662`](../../server/routes/billing.ts#L662) |
| `GET` | `/api/billing/credits-status` | Sesión | — |  | [`server/routes/billing.ts:955`](../../server/routes/billing.ts#L955) |
| `POST` | `/api/billing/webhook` | Firma o secreto | — |  | [`server/routes/billing.ts:986`](../../server/routes/billing.ts#L986) |
| `POST` | `/api/stripe/confirm-success` | Sesión | — |  | [`server/routes/billing.ts:476`](../../server/routes/billing.ts#L476) |
| `POST` | `/api/stripe/consume-credits` | Sesión | — |  | [`server/routes/billing.ts:887`](../../server/routes/billing.ts#L887) |
| `POST` | `/api/stripe/create-checkout-session` | Sesión | — |  | [`server/routes/billing.ts:548`](../../server/routes/billing.ts#L548) |
| `POST` | `/api/stripe/create-portal-session` | Sesión | — |  | [`server/routes/billing.ts:662`](../../server/routes/billing.ts#L662) |
| `GET` | `/api/stripe/credits-status` | Sesión | — |  | [`server/routes/billing.ts:955`](../../server/routes/billing.ts#L955) |
| `POST` | `/api/stripe/webhook` | Firma o secreto | — |  | [`server/routes/billing.ts:987`](../../server/routes/billing.ts#L987) |

### campaigns

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/campaigns` | Sesión | — |  | [`server/routes/campaigns.ts:21`](../../server/routes/campaigns.ts#L21) |
| `POST` | `/api/campaigns` | Sesión | — |  | [`server/routes/campaigns.ts:34`](../../server/routes/campaigns.ts#L34) |
| `POST` | `/api/campaigns/active` | Sesión | — |  | [`server/routes/campaigns.ts:92`](../../server/routes/campaigns.ts#L92) |
| `PUT` | `/api/campaigns/{id}` | Sesión | — |  | [`server/routes/campaigns.ts:58`](../../server/routes/campaigns.ts#L58) |
| `DELETE` | `/api/campaigns/{id}` | Sesión | — |  | [`server/routes/campaigns.ts:78`](../../server/routes/campaigns.ts#L78) |
| `POST` | `/api/campaigns/{id}/record-training` | Sesión | — |  | [`server/routes/campaigns.ts:117`](../../server/routes/campaigns.ts#L117) |
| `POST` | `/api/campaigns/{id}/train-tone-dna` | Sesión | — |  | [`server/routes/campaigns.ts:149`](../../server/routes/campaigns.ts#L149) |

### campanaConcierto

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/campana-concierto/redactar` | Sesión | iaRateLimiter |  | [`server/routes/campanaConcierto.ts:101`](../../server/routes/campanaConcierto.ts#L101) |

### chat

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/chat` | Sesión | — |  | [`server/routes/chat.ts:25`](../../server/routes/chat.ts#L25) |
| `POST` | `/api/write-reels-copy` | Sesión | iaRateLimiter |  | [`server/routes/chat.ts:676`](../../server/routes/chat.ts#L676) |

### concert_to_album

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/concert-to-album/analyze` | Sesión | — |  | [`server/routes/concert_to_album.ts:463`](../../server/routes/concert_to_album.ts#L463) |
| `POST` | `/api/concert-to-album/classify-tracks` | Sesión | — |  | [`server/routes/concert_to_album.ts:1386`](../../server/routes/concert_to_album.ts#L1386) |
| `GET` | `/api/concert-to-album/cookies-status` | Sesión | — |  | [`server/routes/concert_to_album.ts:234`](../../server/routes/concert_to_album.ts#L234) |
| `POST` | `/api/concert-to-album/delete-cookies` | Sesión | — |  | [`server/routes/concert_to_album.ts:275`](../../server/routes/concert_to_album.ts#L275) |
| `POST` | `/api/concert-to-album/demo-audio` | Sesión | — |  | [`server/routes/concert_to_album.ts:1578`](../../server/routes/concert_to_album.ts#L1578) |
| `POST` | `/api/concert-to-album/detect-cues` | Sesión | — |  | [`server/routes/concert_to_album.ts:1021`](../../server/routes/concert_to_album.ts#L1021) |
| `POST` | `/api/concert-to-album/preview-snippet` | Sesión | — |  | [`server/routes/concert_to_album.ts:1357`](../../server/routes/concert_to_album.ts#L1357) |
| `POST` | `/api/concert-to-album/process` | Sesión | — |  | [`server/routes/concert_to_album.ts:767`](../../server/routes/concert_to_album.ts#L767) |
| `POST` | `/api/concert-to-album/save-cookies` | Sesión | — |  | [`server/routes/concert_to_album.ts:251`](../../server/routes/concert_to_album.ts#L251) |
| `POST` | `/api/concert-to-album/transcribe-song` | Sesión | — |  | [`server/routes/concert_to_album.ts:1494`](../../server/routes/concert_to_album.ts#L1494) |
| `POST` | `/api/concert-to-album/transcribe-speech` | Sesión | — |  | [`server/routes/concert_to_album.ts:1300`](../../server/routes/concert_to_album.ts#L1300) |

### concerts

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/calendar-feed-url` | Sesión | — |  | [`server/routes/concerts.ts:416`](../../server/routes/concerts.ts#L416) |
| `GET` | `/api/calendar.ics` | Firma o secreto | — |  | [`server/routes/concerts.ts:442`](../../server/routes/concerts.ts#L442) |
| `GET` | `/api/calendar/conflicts` | Sesión | — |  | [`server/routes/concerts.ts:57`](../../server/routes/concerts.ts#L57) |
| `POST` | `/api/concerts` | Sesión | — |  | [`server/routes/concerts.ts:180`](../../server/routes/concerts.ts#L180) |
| `POST` | `/api/concerts/sync` | Sesión | — |  | [`server/routes/concerts.ts:237`](../../server/routes/concerts.ts#L237) |
| `PUT` | `/api/concerts/{id}` | Sesión | — |  | [`server/routes/concerts.ts:154`](../../server/routes/concerts.ts#L154) |
| `DELETE` | `/api/concerts/{id}` | Sesión | — |  | [`server/routes/concerts.ts:203`](../../server/routes/concerts.ts#L203) |
| `GET` | `/api/logistics` | Sesión | — |  | [`server/routes/concerts.ts:261`](../../server/routes/concerts.ts#L261) |
| `POST` | `/api/logistics/gear` | Sesión | — |  | [`server/routes/concerts.ts:311`](../../server/routes/concerts.ts#L311) |
| `POST` | `/api/logistics/runofshow` | Sesión | — |  | [`server/routes/concerts.ts:284`](../../server/routes/concerts.ts#L284) |
| `POST` | `/api/messages` | Sesión | — |  | [`server/routes/concerts.ts:406`](../../server/routes/concerts.ts#L406) |
| `GET` | `/api/payments` | Sesión + líder | — |  | [`server/routes/concerts.ts:338`](../../server/routes/concerts.ts#L338) |
| `POST` | `/api/payments` | Sesión + líder | — |  | [`server/routes/concerts.ts:350`](../../server/routes/concerts.ts#L350) |
| `POST` | `/api/payments/sync` | Sesión + líder | — |  | [`server/routes/concerts.ts:382`](../../server/routes/concerts.ts#L382) |
| `PUT` | `/api/payments/{id}` | Sesión + líder | — |  | [`server/routes/concerts.ts:363`](../../server/routes/concerts.ts#L363) |
| `POST` | `/api/rehearsals` | Sesión | — |  | [`server/routes/concerts.ts:97`](../../server/routes/concerts.ts#L97) |
| `PUT` | `/api/rehearsals/{id}` | Sesión | — |  | [`server/routes/concerts.ts:71`](../../server/routes/concerts.ts#L71) |
| `DELETE` | `/api/rehearsals/{id}` | Sesión | — |  | [`server/routes/concerts.ts:120`](../../server/routes/concerts.ts#L120) |

### deals

Acuerdos de concierto: vista pública por token y firma.

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/deals` | Sesión | — |  | [`server/routes/deals.ts:58`](../../server/routes/deals.ts#L58) |
| `POST` | `/api/deals` | Sesión | — |  | [`server/routes/deals.ts:137`](../../server/routes/deals.ts#L137) |
| `GET` | `/api/deals/lead/{leadId}` | Sesión | — |  | [`server/routes/deals.ts:115`](../../server/routes/deals.ts#L115) |
| `GET` | `/api/public/deals/{token}` | Pública | — |  | [`server/routes/deals.ts:213`](../../server/routes/deals.ts#L213) |
| `POST` | `/api/public/deals/{token}/resend-email` | Pública | reenvioEmailRateLimiter |  | [`server/routes/deals.ts:440`](../../server/routes/deals.ts#L440) |
| `POST` | `/api/public/deals/{token}/sign` | Pública | — | ★ | [`server/routes/deals.ts:293`](../../server/routes/deals.ts#L293) |

### donations

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/donations/create-checkout-session` | Sesión | donationRateLimiter |  | [`server/routes/donations.ts:83`](../../server/routes/donations.ts#L83) |
| `GET` | `/api/donations/deal-support` | Sesión | — |  | [`server/routes/donations.ts:152`](../../server/routes/donations.ts#L152) |
| `POST` | `/api/donations/deal-support/create-checkout-session` | Sesión | donationRateLimiter |  | [`server/routes/donations.ts:183`](../../server/routes/donations.ts#L183) |
| `GET` | `/api/donations/status` | Sesión | — |  | [`server/routes/donations.ts:45`](../../server/routes/donations.ts#L45) |

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
| `GET` | `/api/autonomy` | Sesión | — |  | [`server/routes/epk_fans.ts:55`](../../server/routes/epk_fans.ts#L55) |
| `POST` | `/api/autonomy` | Sesión | — |  | [`server/routes/epk_fans.ts:73`](../../server/routes/epk_fans.ts#L73) |
| `PUT` | `/api/autonomy` | Sesión | — |  | [`server/routes/epk_fans.ts:107`](../../server/routes/epk_fans.ts#L107) |
| `GET` | `/api/epk` | Sesión | — |  | [`server/routes/epk_fans.ts:144`](../../server/routes/epk_fans.ts#L144) |
| `PUT` | `/api/epk` | Sesión | — |  | [`server/routes/epk_fans.ts:164`](../../server/routes/epk_fans.ts#L164) |
| `GET` | `/api/epk/clicks` | Sesión | — |  | [`server/routes/epk_fans.ts:1081`](../../server/routes/epk_fans.ts#L1081) |
| `POST` | `/api/epk/traducir` | Sesión | — |  | [`server/routes/epk_fans.ts:242`](../../server/routes/epk_fans.ts#L242) |
| `GET` | `/api/fans` | Sesión | — |  | [`server/routes/epk_fans.ts:771`](../../server/routes/epk_fans.ts#L771) |
| `POST` | `/api/fans` | Sesión | — |  | [`server/routes/epk_fans.ts:790`](../../server/routes/epk_fans.ts#L790) |
| `PATCH` | `/api/fans/{id}` | Sesión | — |  | [`server/routes/epk_fans.ts:829`](../../server/routes/epk_fans.ts#L829) |
| `DELETE` | `/api/fans/{id}` | Sesión | — |  | [`server/routes/epk_fans.ts:863`](../../server/routes/epk_fans.ts#L863) |
| `GET` | `/api/musicians-waitlist` | Sesión | — |  | [`server/routes/epk_fans.ts:1191`](../../server/routes/epk_fans.ts#L1191) |
| `GET` | `/api/public/epk` | Pública | — |  | [`server/routes/epk_fans.ts:473`](../../server/routes/epk_fans.ts#L473) |
| `POST` | `/api/public/fans` | Pública | publicoRateLimiter | ★ | [`server/routes/epk_fans.ts:877`](../../server/routes/epk_fans.ts#L877) |
| `POST` | `/api/public/musicians-waitlist` | Pública | publicoRateLimiter |  | [`server/routes/epk_fans.ts:1123`](../../server/routes/epk_fans.ts#L1123) |
| `POST` | `/api/public/track-click` | Pública | publicoRateLimiter |  | [`server/routes/epk_fans.ts:989`](../../server/routes/epk_fans.ts#L989) |

### gmailOAuth

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/gmail-oauth/authorize-url` | Sesión | — |  | [`server/routes/gmailOAuth.ts:119`](../../server/routes/gmailOAuth.ts#L119) |
| `GET` | `/api/gmail-oauth/callback` | Pública | — |  | [`server/routes/gmailOAuth.ts:151`](../../server/routes/gmailOAuth.ts#L151) |
| `POST` | `/api/gmail-oauth/disconnect` | Sesión | — |  | [`server/routes/gmailOAuth.ts:277`](../../server/routes/gmailOAuth.ts#L277) |
| `GET` | `/api/gmail-oauth/status` | Sesión | — |  | [`server/routes/gmailOAuth.ts:264`](../../server/routes/gmailOAuth.ts#L264) |

### leads

Salas, festivales y contactos del CRM de booking. Los agentes (Scout, Redactor, Enviador, Lector) trabajan sobre estos registros; la aprobación es un cambio de `estado`.

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/ai/providers` | Sesión | — |  | [`server/routes/leads/crud.ts:22`](../../server/routes/leads/crud.ts#L22) |
| `POST` | `/api/batch-enrich-campaign` | Sesión | — |  | [`server/routes/leads/enrichment.ts:953`](../../server/routes/leads/enrichment.ts#L953) |
| `POST` | `/api/campaign-mass-search` | Sesión | — |  | [`server/routes/leads/places.ts:412`](../../server/routes/leads/places.ts#L412) |
| `POST` | `/api/detect-all-dates` | Sesión | — |  | [`server/routes/leads/enrichment.ts:876`](../../server/routes/leads/enrichment.ts#L876) |
| `GET` | `/api/example-threads` | Sesión | — |  | [`server/routes/leads/exampleThreads.ts:24`](../../server/routes/leads/exampleThreads.ts#L24) |
| `POST` | `/api/example-threads` | Sesión | — |  | [`server/routes/leads/exampleThreads.ts:37`](../../server/routes/leads/exampleThreads.ts#L37) |
| `PUT` | `/api/example-threads/{id}` | Sesión | — |  | [`server/routes/leads/exampleThreads.ts:69`](../../server/routes/leads/exampleThreads.ts#L69) |
| `DELETE` | `/api/example-threads/{id}` | Sesión | — |  | [`server/routes/leads/exampleThreads.ts:94`](../../server/routes/leads/exampleThreads.ts#L94) |
| `POST` | `/api/extract-emails` | Sesión | — |  | [`server/routes/leads/places.ts:820`](../../server/routes/leads/places.ts#L820) |
| `POST` | `/api/generate-simulated-email` | Sesión | — |  | [`server/routes/leads/simulation.ts:10`](../../server/routes/leads/simulation.ts#L10) |
| `POST` | `/api/import-excel` | Sesión | — |  | [`server/routes/leads/import.ts:13`](../../server/routes/leads/import.ts#L13) |
| `POST` | `/api/import-places` | Sesión | — |  | [`server/routes/leads/places.ts:953`](../../server/routes/leads/places.ts#L953) |
| `GET` | `/api/leads` | Sesión | — | ★ | [`server/routes/leads/crud.ts:39`](../../server/routes/leads/crud.ts#L39) |
| `POST` | `/api/leads` | Sesión | — | ★ | [`server/routes/leads/crud.ts:204`](../../server/routes/leads/crud.ts#L204) |
| `POST` | `/api/leads/ai-lookup` | Sesión | — |  | [`server/routes/leads/enrichment.ts:217`](../../server/routes/leads/enrichment.ts#L217) |
| `POST` | `/api/leads/audit-pitch` | Sesión | — |  | [`server/routes/leads/pitch.ts:15`](../../server/routes/leads/pitch.ts#L15) |
| `POST` | `/api/leads/batch-enrich-campaign` | Sesión | — |  | [`server/routes/leads/enrichment.ts:953`](../../server/routes/leads/enrichment.ts#L953) |
| `POST` | `/api/leads/bulk-delete` | Sesión | — |  | [`server/routes/leads/crud.ts:336`](../../server/routes/leads/crud.ts#L336) |
| `POST` | `/api/leads/campaign-mass-search` | Sesión | — |  | [`server/routes/leads/places.ts:412`](../../server/routes/leads/places.ts#L412) |
| `POST` | `/api/leads/detect-all-dates` | Sesión | — |  | [`server/routes/leads/enrichment.ts:876`](../../server/routes/leads/enrichment.ts#L876) |
| `POST` | `/api/leads/enrich-addresses` | Sesión | — |  | [`server/routes/leads/enrichment.ts:618`](../../server/routes/leads/enrichment.ts#L618) |
| `POST` | `/api/leads/enrich-all-band` | Sesión | — |  | [`server/routes/leads/enrichment.ts:450`](../../server/routes/leads/enrichment.ts#L450) |
| `POST` | `/api/leads/enrich-lead` | Sesión | — |  | [`server/routes/leads/enrichment.ts:394`](../../server/routes/leads/enrichment.ts#L394) |
| `POST` | `/api/leads/extract-emails` | Sesión | — |  | [`server/routes/leads/places.ts:820`](../../server/routes/leads/places.ts#L820) |
| `POST` | `/api/leads/import-places` | Sesión | — |  | [`server/routes/leads/places.ts:953`](../../server/routes/leads/places.ts#L953) |
| `POST` | `/api/leads/multi-source-venues` | Sesión | — |  | [`server/routes/leads/places.ts:1107`](../../server/routes/leads/places.ts#L1107) |
| `POST` | `/api/leads/places-search` | Sesión | — |  | [`server/routes/leads/places.ts:36`](../../server/routes/leads/places.ts#L36) |
| `POST` | `/api/leads/public-cultural-radar` | Sesión | — |  | [`server/routes/leads/places.ts:1171`](../../server/routes/leads/places.ts#L1171) |
| `POST` | `/api/leads/realign-headers` | Sesión | — |  | [`server/routes/leads/crud.ts:34`](../../server/routes/leads/crud.ts#L34) |
| `POST` | `/api/leads/similar-artists-venues` | Sesión | — |  | [`server/routes/leads/places.ts:1132`](../../server/routes/leads/places.ts#L1132) |
| `POST` | `/api/leads/train-tone-dna` | Sesión | — |  | [`server/routes/leads/pitch.ts:161`](../../server/routes/leads/pitch.ts#L161) |
| `GET` | `/api/leads/{id}` | Sesión | — | ★ | [`server/routes/leads/crud.ts:100`](../../server/routes/leads/crud.ts#L100) |
| `PUT` | `/api/leads/{id}` | Sesión | — | ★ | [`server/routes/leads/crud.ts:135`](../../server/routes/leads/crud.ts#L135) |
| `DELETE` | `/api/leads/{id}` | Sesión | — |  | [`server/routes/leads/crud.ts:362`](../../server/routes/leads/crud.ts#L362) |
| `POST` | `/api/leads/{id}/analyze-sentiment` | Sesión | — |  | [`server/routes/leads/reply.ts:75`](../../server/routes/leads/reply.ts#L75) |
| `POST` | `/api/leads/{id}/calculate-break-even` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1533`](../../server/routes/leads/enrichment.ts#L1533) |
| `POST` | `/api/leads/{id}/detect-dates` | Sesión | — |  | [`server/routes/leads/enrichment.ts:825`](../../server/routes/leads/enrichment.ts#L825) |
| `POST` | `/api/leads/{id}/enrich-all-apis` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1269`](../../server/routes/leads/enrichment.ts#L1269) |
| `POST` | `/api/leads/{id}/enrich-booking-window` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1587`](../../server/routes/leads/enrichment.ts#L1587) |
| `POST` | `/api/leads/{id}/enrich-co-booking` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1671`](../../server/routes/leads/enrichment.ts#L1671) |
| `POST` | `/api/leads/{id}/enrich-google-places` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1152`](../../server/routes/leads/enrichment.ts#L1152) |
| `POST` | `/api/leads/{id}/enrich-instagram` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1054`](../../server/routes/leads/enrichment.ts#L1054) |
| `POST` | `/api/leads/{id}/enrich-jina` | Sesión | — |  | [`server/routes/leads/enrichment.ts:762`](../../server/routes/leads/enrichment.ts#L762) |
| `POST` | `/api/leads/{id}/enrich-local-events` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1611`](../../server/routes/leads/enrichment.ts#L1611) |
| `POST` | `/api/leads/{id}/enrich-logistics` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1453`](../../server/routes/leads/enrichment.ts#L1453) |
| `POST` | `/api/leads/{id}/enrich-press-media` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1641`](../../server/routes/leads/enrichment.ts#L1641) |
| `POST` | `/api/leads/{id}/enrich-setlist` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1192`](../../server/routes/leads/enrichment.ts#L1192) |
| `POST` | `/api/leads/{id}/enrich-social` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1491`](../../server/routes/leads/enrichment.ts#L1491) |
| `POST` | `/api/leads/{id}/enrich-spotify` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1106`](../../server/routes/leads/enrichment.ts#L1106) |
| `POST` | `/api/leads/{id}/generate-multi-pitch` | Sesión | — |  | [`server/routes/leads/pitch.ts:34`](../../server/routes/leads/pitch.ts#L34) |
| `POST` | `/api/leads/{id}/generate-reply` | Sesión | — |  | [`server/routes/leads/reply.ts:19`](../../server/routes/leads/reply.ts#L19) |
| `GET` | `/api/leads/{id}/messages` | Sesión | — |  | [`server/routes/leads/crud.ts:121`](../../server/routes/leads/crud.ts#L121) |
| `POST` | `/api/leads/{id}/regenerate-pitch` | Sesión | — |  | [`server/routes/leads/pitch.ts:65`](../../server/routes/leads/pitch.ts#L65) |
| `POST` | `/api/leads/{id}/regenerate-reply` | Sesión | — |  | [`server/routes/leads/reply.ts:155`](../../server/routes/leads/reply.ts#L155) |
| `POST` | `/api/leads/{id}/revert-pitch` | Sesión | — |  | [`server/routes/leads/pitch.ts:100`](../../server/routes/leads/pitch.ts#L100) |
| `POST` | `/api/leads/{id}/verify-email` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1230`](../../server/routes/leads/enrichment.ts#L1230) |
| `POST` | `/api/multi-source-venues` | Sesión | — |  | [`server/routes/leads/places.ts:1107`](../../server/routes/leads/places.ts#L1107) |
| `POST` | `/api/places-search` | Sesión | — |  | [`server/routes/leads/places.ts:36`](../../server/routes/leads/places.ts#L36) |
| `POST` | `/api/public-cultural-radar` | Sesión | — |  | [`server/routes/leads/places.ts:1171`](../../server/routes/leads/places.ts#L1171) |
| `POST` | `/api/scrape-contact` | Sesión | — |  | [`server/routes/leads/enrichment.ts:503`](../../server/routes/leads/enrichment.ts#L503) |
| `POST` | `/api/similar-artists-venues` | Sesión | — |  | [`server/routes/leads/places.ts:1132`](../../server/routes/leads/places.ts#L1132) |
| `GET` | `/api/templates` | Sesión | — |  | [`server/routes/leads/templates.ts:42`](../../server/routes/leads/templates.ts#L42) |
| `POST` | `/api/templates/generate-all` | Sesión | — |  | [`server/routes/leads/templates.ts:333`](../../server/routes/leads/templates.ts#L333) |
| `POST` | `/api/templates/optimize` | Sesión | — |  | [`server/routes/leads/templates.ts:236`](../../server/routes/leads/templates.ts#L236) |
| `POST` | `/api/templates/preview` | Sesión | — |  | [`server/routes/leads/templates.ts:133`](../../server/routes/leads/templates.ts#L133) |
| `POST` | `/api/templates/reset` | Sesión | — |  | [`server/routes/leads/templates.ts:582`](../../server/routes/leads/templates.ts#L582) |
| `POST` | `/api/templates/save` | Sesión | — |  | [`server/routes/leads/templates.ts:59`](../../server/routes/leads/templates.ts#L59) |
| `GET` | `/api/templates/stats` | Sesión | — |  | [`server/routes/leads/templates.ts:437`](../../server/routes/leads/templates.ts#L437) |
| `GET` | `/api/validate-emails` | Sesión | — |  | [`server/routes/leads/emailValidation.ts:15`](../../server/routes/leads/emailValidation.ts#L15) |
| `POST` | `/api/{id}/calculate-break-even` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1533`](../../server/routes/leads/enrichment.ts#L1533) |
| `POST` | `/api/{id}/detect-dates` | Sesión | — |  | [`server/routes/leads/enrichment.ts:825`](../../server/routes/leads/enrichment.ts#L825) |
| `POST` | `/api/{id}/enrich-all-apis` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1269`](../../server/routes/leads/enrichment.ts#L1269) |
| `POST` | `/api/{id}/enrich-booking-window` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1587`](../../server/routes/leads/enrichment.ts#L1587) |
| `POST` | `/api/{id}/enrich-co-booking` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1671`](../../server/routes/leads/enrichment.ts#L1671) |
| `POST` | `/api/{id}/enrich-google-places` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1152`](../../server/routes/leads/enrichment.ts#L1152) |
| `POST` | `/api/{id}/enrich-instagram` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1054`](../../server/routes/leads/enrichment.ts#L1054) |
| `POST` | `/api/{id}/enrich-jina` | Sesión | — |  | [`server/routes/leads/enrichment.ts:762`](../../server/routes/leads/enrichment.ts#L762) |
| `POST` | `/api/{id}/enrich-local-events` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1611`](../../server/routes/leads/enrichment.ts#L1611) |
| `POST` | `/api/{id}/enrich-logistics` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1453`](../../server/routes/leads/enrichment.ts#L1453) |
| `POST` | `/api/{id}/enrich-press-media` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1641`](../../server/routes/leads/enrichment.ts#L1641) |
| `POST` | `/api/{id}/enrich-setlist` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1192`](../../server/routes/leads/enrichment.ts#L1192) |
| `POST` | `/api/{id}/enrich-social` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1491`](../../server/routes/leads/enrichment.ts#L1491) |
| `POST` | `/api/{id}/enrich-spotify` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1106`](../../server/routes/leads/enrichment.ts#L1106) |
| `POST` | `/api/{id}/verify-email` | Sesión | — |  | [`server/routes/leads/enrichment.ts:1230`](../../server/routes/leads/enrichment.ts#L1230) |

### metrics

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/generate-growth-plan` | Sesión | — |  | [`server/routes/metrics.ts:731`](../../server/routes/metrics.ts#L731) |
| `GET` | `/api/metrics` | Sesión | — |  | [`server/routes/metrics.ts:15`](../../server/routes/metrics.ts#L15) |
| `POST` | `/api/metrics` | Sesión | — |  | [`server/routes/metrics.ts:27`](../../server/routes/metrics.ts#L27) |
| `GET` | `/api/metrics/content-items` | Sesión | — |  | [`server/routes/metrics.ts:229`](../../server/routes/metrics.ts#L229) |
| `POST` | `/api/metrics/instagram/connect` | Sesión | — |  | [`server/routes/metrics.ts:461`](../../server/routes/metrics.ts#L461) |
| `POST` | `/api/metrics/instagram/disconnect` | Sesión | — |  | [`server/routes/metrics.ts:578`](../../server/routes/metrics.ts#L578) |
| `GET` | `/api/metrics/instagram/status` | Sesión | — |  | [`server/routes/metrics.ts:362`](../../server/routes/metrics.ts#L362) |
| `POST` | `/api/metrics/real` | Sesión | — |  | [`server/routes/metrics.ts:107`](../../server/routes/metrics.ts#L107) |
| `POST` | `/api/metrics/scan-screenshot` | Sesión | — |  | [`server/routes/metrics.ts:605`](../../server/routes/metrics.ts#L605) |
| `POST` | `/api/metrics/sync` | Sesión | — |  | [`server/routes/metrics.ts:80`](../../server/routes/metrics.ts#L80) |
| `PUT` | `/api/metrics/{id}` | Sesión | — |  | [`server/routes/metrics.ts:40`](../../server/routes/metrics.ts#L40) |
| `DELETE` | `/api/metrics/{id}` | Sesión + líder | — |  | [`server/routes/metrics.ts:59`](../../server/routes/metrics.ts#L59) |

### paginaConcierto

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/e/{slug}` | Pública | publicoRateLimiter |  | [`server/routes/paginaConcierto.ts:39`](../../server/routes/paginaConcierto.ts#L39) |
| `GET` | `/robots.txt` | Pública | — |  | [`server/routes/paginaConcierto.ts:150`](../../server/routes/paginaConcierto.ts#L150) |
| `GET` | `/sitemap.xml` | Pública | publicoRateLimiter |  | [`server/routes/paginaConcierto.ts:132`](../../server/routes/paginaConcierto.ts#L132) |

### posts

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/posts` | Sesión | — |  | [`server/routes/posts.ts:21`](../../server/routes/posts.ts#L21) |
| `POST` | `/api/posts` | Sesión | — |  | [`server/routes/posts.ts:87`](../../server/routes/posts.ts#L87) |
| `POST` | `/api/posts/sync` | Sesión | — |  | [`server/routes/posts.ts:217`](../../server/routes/posts.ts#L217) |
| `POST` | `/api/posts/trigger-webhook` | Sesión | — |  | [`server/routes/posts.ts:241`](../../server/routes/posts.ts#L241) |
| `PUT` | `/api/posts/{id}` | Sesión | — |  | [`server/routes/posts.ts:33`](../../server/routes/posts.ts#L33) |
| `DELETE` | `/api/posts/{id}` | Sesión | — |  | [`server/routes/posts.ts:106`](../../server/routes/posts.ts#L106) |
| `GET` | `/api/social/accounts` | Sesión | — |  | [`server/routes/posts.ts:127`](../../server/routes/posts.ts#L127) |
| `POST` | `/api/social/accounts/connect` | Sesión | — |  | [`server/routes/posts.ts:140`](../../server/routes/posts.ts#L140) |
| `DELETE` | `/api/social/accounts/{id}` | Sesión | — |  | [`server/routes/posts.ts:172`](../../server/routes/posts.ts#L172) |
| `POST` | `/api/social/publish-now/{id}` | Sesión | — |  | [`server/routes/posts.ts:186`](../../server/routes/posts.ts#L186) |
| `POST` | `/api/social/run-scheduled-publisher` | Sesión | — |  | [`server/routes/posts.ts:204`](../../server/routes/posts.ts#L204) |

### reels

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/analyze-video-highlights` | Sesión | iaRateLimiter |  | [`server/routes/reels.ts:481`](../../server/routes/reels.ts#L481) |
| `POST` | `/api/api/reels/ai-hook-doctor` | Sesión | iaRateLimiter |  | [`server/routes/reels.ts:1174`](../../server/routes/reels.ts#L1174) |
| `POST` | `/api/cut-video-clip` | Sesión | renderRateLimiter, renderConcurrencyLimiter |  | [`server/routes/reels.ts:807`](../../server/routes/reels.ts#L807) |
| `POST` | `/api/reanalyze-clip` | Sesión | iaRateLimiter |  | [`server/routes/reels.ts:997`](../../server/routes/reels.ts#L997) |
| `GET` | `/api/reel-analysis` | Sesión | — |  | [`server/routes/reels.ts:443`](../../server/routes/reels.ts#L443) |
| `POST` | `/api/reels/ai-hook-doctor` | Sesión | iaRateLimiter |  | [`server/routes/reels.ts:1174`](../../server/routes/reels.ts#L1174) |
| `GET` | `/api/youtube-meta` | Sesión | — |  | [`server/routes/reels.ts:404`](../../server/routes/reels.ts#L404) |

### referidos

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/public/insignia` | Pública | publicoRateLimiter |  | [`server/routes/referidos.ts:76`](../../server/routes/referidos.ts#L76) |
| `GET` | `/api/referidos` | Sesión | — |  | [`server/routes/referidos.ts:31`](../../server/routes/referidos.ts#L31) |
| `POST` | `/api/referidos/atribuir` | Sesión | — |  | [`server/routes/referidos.ts:47`](../../server/routes/referidos.ts#L47) |

### repertorio

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/ai-composer-arrangement` | Sesión | — |  | [`server/routes/repertorio.ts:757`](../../server/routes/repertorio.ts#L757) |
| `POST` | `/api/enrich-missing-audio` | Sesión | — |  | [`server/routes/repertorio.ts:979`](../../server/routes/repertorio.ts#L979) |
| `POST` | `/api/generate-song-chords` | Sesión | — |  | [`server/routes/repertorio.ts:558`](../../server/routes/repertorio.ts#L558) |
| `PUT` | `/api/letras/auto` | Sesión | — |  | [`server/routes/repertorio.ts:308`](../../server/routes/repertorio.ts#L308) |
| `GET` | `/api/letras/cola` | Sesión | — |  | [`server/routes/repertorio.ts:280`](../../server/routes/repertorio.ts#L280) |
| `POST` | `/api/letras/cola` | Sesión | — |  | [`server/routes/repertorio.ts:289`](../../server/routes/repertorio.ts#L289) |
| `DELETE` | `/api/letras/cola` | Sesión | — |  | [`server/routes/repertorio.ts:299`](../../server/routes/repertorio.ts#L299) |
| `POST` | `/api/optimize-wavs` | Sesión | — |  | [`server/routes/repertorio.ts:965`](../../server/routes/repertorio.ts#L965) |
| `GET` | `/api/setlist-shortcuts` | Sesión | — |  | [`server/routes/repertorio.ts:511`](../../server/routes/repertorio.ts#L511) |
| `POST` | `/api/setlist-shortcuts` | Sesión | — |  | [`server/routes/repertorio.ts:524`](../../server/routes/repertorio.ts#L524) |
| `DELETE` | `/api/setlist-shortcuts/{id}` | Sesión | — |  | [`server/routes/repertorio.ts:544`](../../server/routes/repertorio.ts#L544) |
| `GET` | `/api/setlists` | Sesión | — |  | [`server/routes/repertorio.ts:439`](../../server/routes/repertorio.ts#L439) |
| `POST` | `/api/setlists` | Sesión | — |  | [`server/routes/repertorio.ts:452`](../../server/routes/repertorio.ts#L452) |
| `POST` | `/api/setlists/import-from-image` | Sesión | iaRateLimiter |  | [`server/routes/repertorio.ts:928`](../../server/routes/repertorio.ts#L928) |
| `PUT` | `/api/setlists/{id}` | Sesión | — |  | [`server/routes/repertorio.ts:478`](../../server/routes/repertorio.ts#L478) |
| `DELETE` | `/api/setlists/{id}` | Sesión | — |  | [`server/routes/repertorio.ts:496`](../../server/routes/repertorio.ts#L496) |
| `POST` | `/api/setlists/{setlistId}/analyze-with-ai` | Sesión | — |  | [`server/routes/repertorio.ts:819`](../../server/routes/repertorio.ts#L819) |
| `POST` | `/api/setlists/{setlistId}/generate-perfect-setlist` | Sesión | iaRateLimiter |  | [`server/routes/repertorio.ts:875`](../../server/routes/repertorio.ts#L875) |
| `GET` | `/api/songs` | Sesión | — |  | [`server/routes/repertorio.ts:129`](../../server/routes/repertorio.ts#L129) |
| `POST` | `/api/songs` | Sesión | — |  | [`server/routes/repertorio.ts:144`](../../server/routes/repertorio.ts#L144) |
| `PUT` | `/api/songs/{id}` | Sesión | — |  | [`server/routes/repertorio.ts:167`](../../server/routes/repertorio.ts#L167) |
| `DELETE` | `/api/songs/{id}` | Sesión | — |  | [`server/routes/repertorio.ts:424`](../../server/routes/repertorio.ts#L424) |
| `PATCH` | `/api/songs/{id}/acordes` | Sesión | — |  | [`server/routes/repertorio.ts:322`](../../server/routes/repertorio.ts#L322) |
| `POST` | `/api/songs/{id}/analizar-acordes` | Sesión | — |  | [`server/routes/repertorio.ts:237`](../../server/routes/repertorio.ts#L237) |
| `POST` | `/api/songs/{id}/analizar-dinamica` | Sesión | — |  | [`server/routes/repertorio.ts:188`](../../server/routes/repertorio.ts#L188) |
| `PATCH` | `/api/songs/{id}/energia` | Sesión | — |  | [`server/routes/repertorio.ts:406`](../../server/routes/repertorio.ts#L406) |
| `POST` | `/api/songs/{id}/letra-sincronizada` | Sesión | — |  | [`server/routes/repertorio.ts:270`](../../server/routes/repertorio.ts#L270) |
| `POST` | `/api/songs/{id}/profesor-armonia` | Sesión | — |  | [`server/routes/repertorio.ts:349`](../../server/routes/repertorio.ts#L349) |
| `GET` | `/api/songs/{id}/progreso-oido` | Sesión | — |  | [`server/routes/repertorio.ts:263`](../../server/routes/repertorio.ts#L263) |

### sistema

Salud del servicio, estado de la sesión y páginas legales servidas por server.ts.

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `GET` | `/api/download-excel` | Sesión (comprobada en el handler) | — |  | [`server.ts:255`](../../server.ts#L255) |
| `GET` | `/api/health` | Pública | — | ★ | [`server.ts:166`](../../server.ts#L166) |
| `GET` | `/api/state` | Sesión (comprobada en el handler) | — |  | [`server.ts:497`](../../server.ts#L497) |
| `GET` | `/health` | Pública | — |  | [`server.ts:166`](../../server.ts#L166) |
| `GET` | `/privacy` | Pública | — |  | [`server.ts:180`](../../server.ts#L180) |
| `GET` | `/terms` | Pública | — |  | [`server.ts:222`](../../server.ts#L222) |

### songs

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/songs/{songId}/upload-structure` | Sesión | — |  | [`server/routes/songs/structureUpload.ts:158`](../../server/routes/songs/structureUpload.ts#L158) |

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
| `POST` | `/api/upload` | Sesión | — |  | [`server/routes/upload.ts:509`](../../server/routes/upload.ts#L509) |
| `POST` | `/api/upload/chunk` | Sesión | — |  | [`server/routes/upload.ts:647`](../../server/routes/upload.ts#L647) |
| `POST` | `/api/upload/cleanup-unused-media` | Sesión | — |  | [`server/routes/upload.ts:438`](../../server/routes/upload.ts#L438) |
| `GET` | `/api/upload/storage-stats` | Sesión | — |  | [`server/routes/upload.ts:409`](../../server/routes/upload.ts#L409) |
| `GET` | `/api/upload/test-supabase` | Sesión | — |  | [`server/routes/upload.ts:337`](../../server/routes/upload.ts#L337) |

### users

Autenticación (login, registro, Google, invitaciones, cambio de banda) y gestión de usuarios.

| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |
|---|---|---|---|---|---|
| `POST` | `/api/auth/activate-member` | Sesión opcional | loginRateLimiter |  | [`server/routes/users/rutasInvitacion.ts:73`](../../server/routes/users/rutasInvitacion.ts#L73) |
| `POST` | `/api/auth/check-invitation` | Pública | loginRateLimiter |  | [`server/routes/users/rutasInvitacion.ts:17`](../../server/routes/users/rutasInvitacion.ts#L17) |
| `POST` | `/api/auth/google` | Sesión (comprobada en el handler) | loginRateLimiter |  | [`server/routes/users/rutasGoogle.ts:18`](../../server/routes/users/rutasGoogle.ts#L18) |
| `POST` | `/api/auth/login` | Sesión (comprobada en el handler) | loginRateLimiter | ★ | [`server/routes/users/rutasLogin.ts:15`](../../server/routes/users/rutasLogin.ts#L15) |
| `POST` | `/api/auth/logout` | Sesión opcional | — |  | [`server/routes/users/rutasSesion.ts:320`](../../server/routes/users/rutasSesion.ts#L320) |
| `GET` | `/api/auth/me` | Sesión (comprobada en el handler) | — |  | [`server/routes/users/rutasSesion.ts:13`](../../server/routes/users/rutasSesion.ts#L13) |
| `POST` | `/api/auth/register` | Sesión opcional | registroRateLimiter |  | [`server/routes/users/rutasRegistro.ts:18`](../../server/routes/users/rutasRegistro.ts#L18) |
| `POST` | `/api/auth/reset-password/confirm` | Firma o secreto | loginRateLimiter |  | [`server/routes/users/rutasRecuperacion.ts:203`](../../server/routes/users/rutasRecuperacion.ts#L203) |
| `POST` | `/api/auth/reset-password/request` | Pública | loginRateLimiter |  | [`server/routes/users/rutasRecuperacion.ts:16`](../../server/routes/users/rutasRecuperacion.ts#L16) |
| `POST` | `/api/auth/switch-band` | Sesión (comprobada en el handler) | — |  | [`server/routes/users/rutasSesion.ts:135`](../../server/routes/users/rutasSesion.ts#L135) |
| `POST` | `/api/auth/test-email` | Sesión | — |  | [`server/routes/users/rutasRecuperacion.ts:326`](../../server/routes/users/rutasRecuperacion.ts#L326) |
| `POST` | `/api/bands/logo` | Sesión | — |  | [`server/routes/users/rutasBandas.ts:15`](../../server/routes/users/rutasBandas.ts#L15) |
| `POST` | `/api/bands/upload-logo` | Sesión | — |  | [`server/routes/users/rutasBandas.ts:15`](../../server/routes/users/rutasBandas.ts#L15) |
| `POST` | `/api/create-band` | Sesión | — |  | [`server/routes/users/rutasBandas.ts:100`](../../server/routes/users/rutasBandas.ts#L100) |
| `DELETE` | `/api/leave-band/{bandId}` | Sesión | — |  | [`server/routes/users/rutasSalidaBanda.ts:13`](../../server/routes/users/rutasSalidaBanda.ts#L13) |
| `GET` | `/api/registered-bands` | Sesión | — |  | [`server/routes/users/rutasRegistro.ts:314`](../../server/routes/users/rutasRegistro.ts#L314) |
| `POST` | `/api/set-band-order` | Sesión | — |  | [`server/routes/users/rutasPreferencias.ts:120`](../../server/routes/users/rutasPreferencias.ts#L120) |
| `POST` | `/api/set-main-band` | Sesión | — |  | [`server/routes/users/rutasPreferencias.ts:14`](../../server/routes/users/rutasPreferencias.ts#L14) |
| `GET` | `/api/ui-preferences` | Sesión | — |  | [`server/routes/users/rutasPreferencias.ts:249`](../../server/routes/users/rutasPreferencias.ts#L249) |
| `POST` | `/api/ui-preferences` | Sesión | — |  | [`server/routes/users/rutasPreferencias.ts:176`](../../server/routes/users/rutasPreferencias.ts#L176) |
| `POST` | `/api/upload-logo` | Sesión | — |  | [`server/routes/users/rutasBandas.ts:15`](../../server/routes/users/rutasBandas.ts#L15) |
| `GET` | `/api/users` | Sesión | — |  | [`server/routes/users/rutasMiembros.ts:104`](../../server/routes/users/rutasMiembros.ts#L104) |
| `POST` | `/api/users` | Sesión + líder | — |  | [`server/routes/users/rutasMiembros.ts:147`](../../server/routes/users/rutasMiembros.ts#L147) |
| `POST` | `/api/users/associate` | Sesión + líder | — |  | [`server/routes/users/rutasMiembros.ts:18`](../../server/routes/users/rutasMiembros.ts#L18) |
| `POST` | `/api/users/create-band` | Sesión | — |  | [`server/routes/users/rutasBandas.ts:100`](../../server/routes/users/rutasBandas.ts#L100) |
| `DELETE` | `/api/users/leave-band/{bandId}` | Sesión | — |  | [`server/routes/users/rutasSalidaBanda.ts:13`](../../server/routes/users/rutasSalidaBanda.ts#L13) |
| `GET` | `/api/users/registered-bands` | Sesión | — |  | [`server/routes/users/rutasRegistro.ts:315`](../../server/routes/users/rutasRegistro.ts#L315) |
| `POST` | `/api/users/set-band-order` | Sesión | — |  | [`server/routes/users/rutasPreferencias.ts:120`](../../server/routes/users/rutasPreferencias.ts#L120) |
| `POST` | `/api/users/set-main-band` | Sesión | — |  | [`server/routes/users/rutasPreferencias.ts:14`](../../server/routes/users/rutasPreferencias.ts#L14) |
| `GET` | `/api/users/ui-preferences` | Sesión | — |  | [`server/routes/users/rutasPreferencias.ts:249`](../../server/routes/users/rutasPreferencias.ts#L249) |
| `POST` | `/api/users/ui-preferences` | Sesión | — |  | [`server/routes/users/rutasPreferencias.ts:176`](../../server/routes/users/rutasPreferencias.ts#L176) |
| `POST` | `/api/users/upload-logo` | Sesión | — |  | [`server/routes/users/rutasBandas.ts:15`](../../server/routes/users/rutasBandas.ts#L15) |
| `PUT` | `/api/users/{id}` | Sesión | — |  | [`server/routes/users/rutasMiembrosEdicion.ts:15`](../../server/routes/users/rutasMiembrosEdicion.ts#L15) |
| `DELETE` | `/api/users/{id}` | Sesión + líder | — |  | [`server/routes/users/rutasMiembrosEdicion.ts:228`](../../server/routes/users/rutasMiembrosEdicion.ts#L228) |

## Avisos del análisis estático

- Sin rutas declaradas dos veces.

- Sin rutas sombreadas.

Omitidas a propósito:

- GET /* (server.ts:582): fallback de la SPA, no es API

