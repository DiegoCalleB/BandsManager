# 📖 Glosario de Términos - BandManager.ai

Términos, acrónimos y conceptos clave del proyecto.

---

## A

**Agentic Status** — Sub-estado de un lead en la cola de agentes IA. Valores: `pendiente_aprobacion`, `aprobado_propuesta`, `aprobado_respuesta`, `borrador_creado`. Distinto de `estado` (CRM funnel).

**App URL** — Dirección base de la aplicación (ej: `https://bandmanager.ai`). Usado en OAuth redirects y EPK links públicos.

**Aprobación Humana** — Gate obligatorio antes de cualquier envío de email. Un usuario debe presionar "Aprobar" en la UI. Nunca omitible.

**Autonomy Config** — Tabla en Supabase que guarda configuración per-banda: `dispatch_mode`, `scout_enabled`, `horas_enviador`, etc.

---

## B

**Band** — Tenant en el sistema. Cada banda tiene su propio:
- ID único
- Plan de suscripción
- Usuarios (miembros)
- Leads, conciertos, repertorio, fans, etc.

**Band ID** — UUID único de una banda. Usado como partition key en casi toda la DB.

**Band Access** — Validación de que un usuario puede acceder a una banda específica. Implementado en `getTargetBandId(req)`.

**Booking Agent** — Sistema de 5 agentes que automatizan descubrimiento + pitching + envío + monitoreo de respuestas (Scout, Redactor, Enviador, Lector, + Humano).

**Borrador** — Draft de email en Gmail/IMAP creado pero no enviado. En modo `draft_gmail`, el Enviador crea borradores, no envía.

---

## C

**Cache** — Tarifa que una banda cobra a una sala por tocar. Negociable.

**CRM Funnel** — Dimensión principal de estado del lead: `nuevo` → `contactado` → `respondido` → `negociando` → `confirmado`.

**CRON_SECRET** — Secret env var para autorizar llamadas internas (webhooks de Postgres, OAuth state signing).

---

## D

**Despacho** — Envío de email por parte del Enviador. Puede ser draft (para revisión) o directo.

**Dispatch Mode** — Configuración per-banda en `autonomy_configs`: `draft_gmail` (crea borrador) o `direct_send` (envía directo).

**DB** — Supabase (PostgreSQL). La única fuente de verdad. Google Sheets está prohibido.

**Dimensions** — BandManager usa 2 dimensiones para estados de lead: CRM (`estado`) × Agentic (`agentic_status`).

---

## E

**Enriquecimiento (Enrichment)** — Proceso de agregar datos adicionales a un lead (ej: followers en IG, horario de atención, ratings).

**EPK** — Electronic Press Kit. Dossier público de la banda (biografía, fotos, videos, links, contacto). Ruta pública: `/epk/:bandSlug`.

**Estado** — Dimensión principal de un lead. Valores: `nuevo`, `contactado`, `esperando_respuesta`, `respondido`, `negociando`, `confirmado`, `aplazado`, `no_interesado`.

**Estadío** — Fase en la que está un lead. Sinónimo de `estado` (menos usado).

---

## E

**Enviador** — Agente que envía emails aprobados (respeta dispatch_mode, ventana horaria, rate limits).

---

## F

**Fan** — Contacto/seguidor de una banda. Capturado en formulario de post-EPK o a través de interacciones.

**Feature Flag** — Parámetro de configuración que activa/desactiva features (ej: `scout_enabled` en autonomy_configs).

---

## G

**Gmail OAuth2** — Integración oficial de Gmail con consentimiento del usuario (refresh token guardado). Preferido sobre IMAP.

**getTargetBandId()** — Función crítica en `server/utils/bandAccess.ts`. Valida que un usuario puede acceder a la banda solicitada. **OBLIGATORIO** en toda ruta que toca datos de banda.

---

## H

**Handler** — Función que procesa un HTTP request (en Express).

**Human-in-the-Loop** — Modelo de IA donde humanos aprueban acciones (ej: pitches, emails) antes de que agentes las ejecuten. **No omitible en BandManager.**

---

## I

**IMAP** — Protocolo de email. Usado como fallback si banda no conecta Gmail OAuth2.

---

## J

**JWT** — JSON Web Token. Usado para sesiones autenticadas. Generado en login, validado en `requireAuth` middleware.

---

## L

**Lead** — Sala/venue que Scout descubrió o que humano creó manualmente. Candidato a concierto.

**Lector** — Agente que monitorea buzón (Gmail/IMAP) para detectar respuestas a pitches y drafts enviados manualmente.

**Límite de Plan** — Máximo de registros permitidos según suscripción (ej: plan `promo` permite 0 leads, 250 fans).

---

## M

**Middleware** — Función que procesa request antes de llegar al handler (ej: `requireAuth`, `withBandId`, rate limiter).

**Multi-tenancy** — Arquitectura donde múltiples clientes (bandas) comparten infrastructure pero sus datos están aislados.

**Multi-tenancy Scoping** — Conjunto de prácticas para garantizar ese aislamiento (trust boundary, SSRF guard, plan limits).

---

## O

---

## P

**Pitch** — Propuesta personalizada de concierto que Redactor genera. Incluye nombre banda, historia, fecha, EPK link, etc.

**Plan** — Suscripción de una banda. Valores: `promo`, `ensayo`, `local`, `de_gira`, `cabeza_de_cartel`. Define features + límites.

**Plan Permissions** — Archivo `src/utils/planPermissions.ts` que decide qué muestra/oculta en UI según plan. **NO es suficiente**, server valida también.

**Promo** — Plan Tier 0: bandas en festivales/showcases. Solo EPK, QR, fans, calendario. Sin booking CRM.

---

## Q

**QR** — Código QR público de la banda que vincula a EPK o fans form.

---

## R

**Rate Limiter** — Middleware que limita requests: `loginRateLimiter` (login), `iaRateLimiter` (endpoints de IA).

**Redactor** — Agente que genera pitches personalizados basado en perfil de banda + venue.

**Reels** — Videos cortos virales (TikTok, Instagram, etc.) generados automáticamente. Almacenados en Supabase Storage.

**Reply** — Respuesta de venue a pitch inicial. Detectada por Lector, transita lead a `respondido`.

---

## S

**Scout** — Agente que descubre salas/festivales vía web scraping + APIs.

**Session** — Registro autenticado de usuario. Guardado en `ACTIVE_SESSIONS` (in-memory).

**Setlist** — Lista ordenada de canciones que banda toca en un concierto.

**SSRF** — Server-Side Request Forgery. Ataque donde servidor fetch() a IP privada. Mitigado con `esUrlExternaSegura()`.

**State** — Objeto en memoria con toda la app state (bands, users, leads, concerts, etc.). Cargado desde Supabase al iniciar server.

---

## T

**Tenant** — Cliente. En BandManager = banda.

**TFM** — Trabajo Fin de Máster (thesis). Tema: IA agents multiplican productividad de 1 dev.

**Tone DNA** — Descripción curada de cómo una banda "suena" (tono, voz, personaje). Usado por Redactor para generar pitches coherentes.

**Track** — Canción. Sinónimo de `song`.

**Trust Boundary** — Límite de confianza entre componentes. En BandManager: **nunca** confíes en `req.body.band_id`, siempre valida con `getTargetBandId()`.

---

## U

**UI** — User Interface (frontend).

---

## V

**Venue** — Sala de conciertos, festival, etc.

**Vitest** — Testing framework (similar a Jest, built on Vite).

---

## W

---

## X

**X-Band-ID** — HTTP header que cliente envía para especificar band activa. Validado en server (no es fuente de verdad).

**X-Content-Type-Options** — HTTP header que previene MIME sniffing en browsers.

---

## Y

---

## Z

---

## Acrónimos

| Acrónimo | Significado |
|----------|------------|
| AI | Artificial Intelligence |
| API | Application Programming Interface |
| BI | Business Intelligence |
| CRM | Customer Relationship Management |
| CSV | Comma-Separated Values |
| DB | Database |
| EPK | Electronic Press Kit |
| HTTP | HyperText Transfer Protocol |
| IMAP | Internet Message Access Protocol |
| JWT | JSON Web Token |
| OAuth | Open Authorization |
| PBKDF2 | Password-Based Key Derivation Function 2 |
| SMTP | Simple Mail Transfer Protocol |
| SSRF | Server-Side Request Forgery |
| SPA | Single Page Application |
| SQL | Structured Query Language |
| SSO | Single Sign-On |
| TFM | Trabajo Fin de Máster |
| UI | User Interface |
| UX | User Experience |
| UUID | Universally Unique Identifier |
| VCS | Version Control System |

---

## Estados Frecuentes

### Lead `estado`
```
nuevo → contactado → respondido → negociando → confirmado
↓ (alternativo)
no_interesado / aplazado
```

### Lead `agentic_status`
```
(empty) ← pendiente_aprobacion ← [Redactor]
          ↓ [Humano aprueba]
        aprobado_propuesta ← [Enviador] ← borrador_creado ← [Lector detecta manual send]
```

---

## Configuración vs Datos

| Tipo | Ejemplo | Cómo se edita |
|------|---------|---------------|
| **Configuración** | dispatch_mode, horas_enviador, plan | `autonomy_configs` table, UI settings |
| **Datos** | leads, concerts, songs, fans | Rutas REST, actualizaciones automáticas |

---

## Componentes Principales (Frontend)

| Componente | Ubicación | Función |
|------------|-----------|---------|
| `App` | `src/App.tsx` | Shell autenticado principal |
| `LeadCard` | `src/components/booking/` | Visualizar + editar lead |
| `RepertorioTable` | `src/components/repertorio/` | Listar songs + setlist |
| `ReelsCenter` | `src/components/reels/` | Generar + subir reels |
| `EPKComponent` | `src/components/epk/` | EPK público (no autenticado) |

---

## Funciones Críticas (Backend)

| Función | Archivo | Función |
|---------|---------|---------|
| `getTargetBandId()` | `server/utils/bandAccess.ts` | Valida acceso a banda |
| `esUrlExternaSegura()` | `server/utils/ssrfGuard.ts` | SSRF guard |
| `dbGetLeads()` | `server/db/leads.ts` | Fetch leads (con bandId filter) |
| `requireAuth` | `server/auth.ts` | Middleware autenticación |
| `scoutLeads()` | `server/utils/scoutLeads.ts` | Scout agent |
| `generatePitch()` | `server/services/agentEngine.ts` | Redactor agent |
| `sendEmail()` | `server/services/emailAgentClient.ts` | Enviador agent |
| `checkReplies()` | `server/services/lectorAgent.ts` | Lector agent |

---

## Env Vars Clave

| Env Var | Uso | Producción |
|---------|-----|-----------|
| `SUPABASE_URL` | Conexión DB | requerido |
| `SUPABASE_ANON_KEY` | Auth Supabase | requerido |
| `JWT_SECRET` | Sign JWTs | requerido |
| `CRON_SECRET` | Autoricar webhooks internos | requerido |
| `AGENT_EMAIL_MODE` | draft o send | `draft` (seguro) |
| `GOOGLE_OAUTH_CLIENT_ID` | Gmail app registration | requerido |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Gmail app secret | requerido |
| `GEMINI_API_KEY` | Lyria model (música) | requerido |

---

