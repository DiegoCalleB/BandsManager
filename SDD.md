# 📐 SDD — Software Design Document (BandManager.ai)

> **Trabajo Fin de Máster:** Desarrollo de Software Asistido por Inteligencia Artificial Agéntica.
>
> Este documento es el **diseño de software** de BandManager.ai: qué se construyó, por qué se
> tomó cada decisión de arquitectura, y cómo encajan entre sí los subsistemas. No repite
> instrucciones operativas ni reglas de negocio — esas viven, completas y como fuente única de
> verdad, en:
>
> - **[`AGENTS.md`](./AGENTS.md)** — reglas de negocio no-negociables (seguridad, multi-tenancy,
>   agentes IA human-in-the-loop). Si algo en este SDD contradice `AGENTS.md`, gana `AGENTS.md`.
> - **[`CLAUDE.md`](./CLAUDE.md)** — guía técnica de implementación (comandos, estructura de
>   ficheros, convenciones de test).
>
> El SDD es el **porqué arquitectónico**; `AGENTS.md`/`CLAUDE.md` son el **qué/cómo operativo**.

---

## 1. Introducción

### 1.1 Propósito
BandManager.ai es una plataforma full-stack para bandas y artistas independientes que unifica:
booking (CRM + agentes IA de captación), logística de gira, EPK, repertorio, finanzas, captación
de fans, generación de contenido social (Reels) y herramientas de IA musical.

El interés del TFM no es el dominio (gestión de bandas) sino **cómo diseñar un sistema que
delega trabajo a agentes de IA autónomos sin comprometer seguridad, aislamiento de datos ni
control humano sobre acciones irreversibles** (enviar un email en nombre de un tercero).

### 1.2 Alcance
Cubre: arquitectura de dos runtimes, modelo de datos multi-tenant, el subsistema de agentes de
booking (el núcleo del TFM), y los subsistemas de IA generativa (Reels, música). No cubre
detalles de UI/UX ni el roadmap comercial.

### 1.3 Audiencia
Tribunal del TFM y cualquier desarrollador que se incorpore al proyecto tras su entrega.

---

## 2. Vista de Arquitectura General

### 2.1 Diagrama de capas

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React 19 + Vite)                                 │
│  src/App.tsx ─── src/hooks/useAppData.ts (fetch central)    │
│  src/services/api.ts → adjunta JWT + x-band-id header       │
└───────────────────────────┬───────────────────────────────┘
                             │ HTTPS /api/*
┌───────────────────────────▼───────────────────────────────┐
│  Backend (Express + TypeScript, Node 22) — server.ts       │
│  ┌───────────────┐  ┌──────────────────┐  ┌─────────────┐ │
│  │ Routers        │  │ Trust boundary   │  │ Agent        │ │
│  │ /api/*         │──▶ getTargetBandId  │──▶ Scheduler    │ │
│  │ (server/routes)│  │ (bandAccess.ts)  │  │ (60s tick)   │ │
│  └───────────────┘  └──────────────────┘  └─────────────┘ │
│  server/state.ts (estado en memoria, seed + sync)          │
└───────────────────────────┬───────────────────────────────┘
                             │ loadStateFromSupabase / dbUpsertX
┌───────────────────────────▼───────────────────────────────┐
│  Supabase (PostgreSQL) — única fuente de verdad             │
│  bands · leads · concerts · tours · payments · fans ·       │
│  autonomy_configs · band_gmail_oauth_accounts · ...         │
│  + Supabase Storage (clips de Reels, uploads)                │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Decisión: un único artefacto de despliegue
`npm run build` empaqueta frontend (Vite) y backend (`server.ts` → `dist/server.cjs` vía esbuild)
en un solo bundle servido por `npm start`. **Justificación:** simplifica el despliegue en Railway
(un solo proceso, un solo healthcheck) a costa de acoplar el ciclo de release de API y UI —
aceptable para el tamaño actual del equipo (una persona).

### 2.3 Decisión: estado en memoria sincronizado, no acceso directo a BD por request
Los handlers no consultan Supabase en cada request; leen/escriben sobre un objeto de estado en
memoria (`server/state.ts`) hidratado al arrancar y sincronizado en cada mutación.
**Justificación:** reduce latencia percibida en un CRM con lecturas frecuentes; el coste es que
cada mutación debe recordar persistir explícitamente (ver `dbUpsertX` en §3.2) — es una fuente de
bugs si se olvida, mitigada por convención de código, no por el compilador.

---

## 3. Diseño de Datos y Multi-tenancy

### 3.1 Modelo de aislamiento por banda
Cada usuario pertenece a una o más bandas (`AuthContext.availableBands`). Toda entidad de negocio
está scoped por `band_id`. El aislamiento se resuelve en **dos puntos de confianza**, no uno:

1. **Capa de ruta** — `getTargetBandId(req)` (`server/utils/bandAccess.ts`) decide la banda
   objetivo a partir de la sesión autenticada, honrando el header `x-band-id` solo si el usuario
   realmente pertenece a esa banda (o es admin de plataforma).
2. **Capa de datos** — cada `dbUpsertX(objeto, bandId)` en `server/db/*.ts` usa únicamente el
   `bandId` ya resuelto por la ruta; nunca un `band_id` que venga en el cuerpo de la petición.

### 3.2 Por qué dos puntos y no uno
El sistema tuvo una vulnerabilidad real (documentada en `CLAUDE.md`): varias funciones de
`server/db/*.ts` calculaban `cleanBandId(objeto.band_id || bandId)`, dejando que un `band_id` no
validado en el **cuerpo** de la petición pisara el de la sesión. Cualquier usuario autenticado
podía escribir en datos de otra banda añadiendo `"band_id": "otra-banda"` al payload.
**Decisión de diseño:** el trust boundary no puede vivir solo en el middleware de ruta — debe
repetirse en la capa de acceso a datos, porque un handler mal escrito en el futuro puede volver a
leer el body. Se formalizó como regla arquitectónica no-negociable (§2.1 de `AGENTS.md`) y como
test estático en CI (`bandIdTrustBoundary.test.ts`) que escanea el patrón peligroso en texto, no
solo lo prueba en runtime — así una reintroducción del bug falla el build aunque nadie escriba un
test específico para ese archivo nuevo.

### 3.3 Migración fuera de Google Sheets
Supabase es la única fuente de verdad; Sheets está retirado por completo. Es una decisión de
diseño, no un detalle de implementación: un spreadsheet como backend no soporta transacciones,
RLS ni los triggers de Postgres de los que depende el subsistema de agentes (§4.4).

---

## 4. Diseño del Subsistema de Agentes de Booking (núcleo del TFM)

Este es el subsistema que justifica el TFM: agentes de IA que actúan sobre datos reales de
terceros (salas de conciertos) con una acción externa e irreversible (enviar un email).

### 4.1 Por qué cuatro agentes y no uno
Se descompuso el flujo en cuatro responsabilidades independientes en lugar de un único agente
monolítico "que gestiona el booking":

| Agente | Responsabilidad única | Por qué está separado |
|---|---|---|
| **Scout** | Descubre/enriquece leads | Fuente de datos ruidosa (scraping); aislar sus fallos evita que tumben el envío |
| **Redactor** | Genera el pitch, nunca lo envía | El punto de generación de contenido IA y el punto de envío deben poder auditarse por separado |
| **Enviador** | Despacha solo lo aprobado, respeta ventana horaria y rate-limits | Es el único agente con capacidad de acción externa — su superficie de código es intencionalmente pequeña |
| **Lector** | Monitoriza respuestas entrantes cada ~60s | Corre siempre, sin ventana horaria — no hay motivo de negocio para retrasar la detección de una respuesta |

Esta separación es lo que permite razonar sobre el sistema con garantías: "nada se envía sin
aprobación humana" es una propiedad verificable del **Enviador** exclusivamente, no de todo el
pipeline.

### 4.2 Máquina de estados en dos dimensiones
Se modeló el ciclo de vida de un lead con **dos dimensiones ortogonales** en vez de un único
`estado` enumerado:

- **Dimensión CRM** (`estado`): `nuevo → contactado → respondido → negociando → confirmado`
  (o `aplazado`/`no_interesado`). Refleja dónde está la negociación con la sala.
- **Dimensión agéntica** (sub-estado): `pendiente_aprobacion → aprobado_propuesta/aprobado_respuesta
  → borrador_creado`. Refleja qué ha hecho/puede hacer la IA sobre ese lead.

**Justificación:** colapsar ambas en un único enum obligaría a estados combinados artificiales
(`"contactado_pero_borrador_pendiente_de_revision"`) que crecen combinatoriamente con cada nueva
capacidad del agente. Mantenerlas separadas permite añadir sub-estados agénticos nuevos (por
ejemplo, un futuro agente de seguimiento) sin tocar el embudo CRM que ve el usuario.

### 4.3 Human-in-the-loop como invariante de diseño, no como feature
La aprobación humana antes de cualquier envío no es una opción de configuración — es una
propiedad que el diseño hace estructuralmente difícil de saltarse:

- El **Redactor** solo puede dejar un lead en `pendiente_aprobacion`; no tiene código que
  transicione a `aprobado_*`.
- El **Enviador** solo procesa leads ya en `aprobado_propuesta`/`aprobado_respuesta` — es una
  precondición de su query contra Supabase, no un `if` que se pueda olvidar en un handler nuevo.
- `dispatch_mode` (borrador vs. envío directo) actúa **después** de la aprobación humana — decide
  el canal de salida, nunca si hay salida.
- Existe además un interruptor de plataforma independiente del control por banda
  (`AGENT_EMAIL_MODE`): ninguna banda puede, por su cuenta, desbloquear envío real. Es un segundo
  cerrojo que no depende de que cada band-admin configure bien su propia banda.

**Por qué dos cerrojos y no uno:** el mismo patrón de defensa en profundidad que en §3.2 (dos
puntos de verificación, no uno) — si el cerrojo por banda tiene un bug, el cerrojo de plataforma
sigue conteniendo el daño a "modo draft" en todas las bandas a la vez, no solo en la que falló.

### 4.4 Redundancia de canal de correo (OAuth vs. IMAP) y su motivo
Se soportan dos vías de conexión de buzón (Gmail OAuth "offline" e IMAP/SMTP con contraseña de
aplicación) en vez de una sola. **Justificación:** el Enviador/Lector corren de forma
desatendida desde un scheduler en background — no hay ventana de interacción del usuario para un
popup de login en el momento de enviar. OAuth "offline" (refresh token) resuelve esto para Gmail;
IMAP/SMTP cubre el resto de proveedores donde no hay equivalente OAuth practicable para esta
escala de proyecto. Ambos caminos convergen en un único componente de conexión en el frontend
(`EmailAccountConfig.tsx`) para evitar que una segunda UI de "conectar email" persista estado que
el scheduler nunca llega a leer (bug real que ya ocurrió una vez en este proyecto).

---

## 5. Diseño de Seguridad (superficie ampliada por agentes de IA)

Los agentes de IA introducen dos superficies de ataque que un CRM tradicional no tiene:

1. **SSRF vía enriquecimiento de leads** — el Scout hace `fetch()` de webs de salas aportadas por
   datos externos (no directamente por el usuario, pero igual de no confiables). Toda petición
   saliente pasa por `esUrlExternaSegura` (`server/utils/ssrfGuard.ts`), que valida no solo el
   host literal sino la IP resuelta por DNS — cerrando el bypass clásico de DNS-rebinding donde el
   host pasa la validación inicial y luego resuelve a una IP privada en la petición real.
2. **Consumo de cuota de IA generativa no autenticado** — endpoints como `/api/generate-music` o
   `/write-reels-copy` llaman a modelos de pago (Gemini/Lyria). Ambos requieren `requireAuth` **y**
   un rate limiter dedicado (`iaRateLimiter`); un solo control sin el otro deja abierto o un abuso
   de cuota económica por un usuario autenticado, o acceso anónimo directo.

---

## 6. Subsistemas de IA Generativa

### 6.1 Reels & Social Content
Pipeline: scraping de canales (YouTube Data API o `yt-dlp`) → selección de fragmentos por energía
real de audio (no solo keywords de transcripción) → render → almacenamiento en Supabase Storage
(nunca disco de Railway, que es efímero: un redeploy borraría los clips). El "Tone DNA" es estado
persistente **por banda**, no un prompt hardcodeado — decisión tomada tras un bug real donde la
voz de la banda de referencia del proyecto se filtraba en los reels de todas las demás bandas.

### 6.2 AI Music & Sound Studio
Genera ideas musicales con modelos de IA (Gemini Lyria para pistas; síntesis local con `tone.js`
para instrumentos). **Decisión de diseño clave:** se valida y repara la salida de la IA (notas
fuera de rango, duraciones inválidas) antes de pasarla al sintetizador — la IA generativa de
música no es determinísticamente válida como MIDI, y fallar silenciosamente ahí produciría audio
roto en producción en vez de un error controlado.

---

## 7. Calidad, Testing y Trazabilidad

El estilo de test establecido (`server/utils/__tests__`, `server/db/__tests__`) prueba funciones
puras contra un `loadState`/`req` simulado en vez de levantar el servidor Express con un cliente
HTTP real. **Justificación de diseño:** obliga a que la lógica de seguridad/scoping crítica viva
en funciones exportadas y testeables (`bandAccess.ts`, `ssrfGuard.ts`) en vez de enterrada dentro
de un handler de ruta — el propio requisito de testabilidad empuja hacia una mejor separación de
responsabilidades. El test estático de `bandIdTrustBoundary.test.ts` (§3.2) es un ejemplo de clase
de prueba poco común (escanea texto fuente, no comportamiento runtime) elegido deliberadamente
para prevenir una *clase* de bug, no una instancia.

---

## 8. Decisiones abiertas / trabajo futuro

- `npm run lint:eslint` reporta ~2500 findings (mayormente `no-explicit-any`) no resueltos: deuda
  de tipado reconocida y explícitamente no bloqueante en CI — decisión consciente de priorizar
  velocidad de iteración del TFM sobre tipado estricto retroactivo.
- El scheduler de agentes es un proceso único en memoria (60s tick) — válido a la escala actual;
  no está diseñado para múltiples instancias del backend corriendo a la vez (no hay lock
  distribuido). Documentado aquí como límite conocido de la arquitectura, no como bug.

---

## 9. Referencias

- [`AGENTS.md`](./AGENTS.md) — reglas de negocio y directivas operativas completas (fuente de
  verdad; no duplicar contenido de aquí allí ni viceversa).
- [`CLAUDE.md`](./CLAUDE.md) — comandos, estructura de ficheros, convenciones de CI/testing.
