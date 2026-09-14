# 🎸 AGENTS.md — Instrucciones y Directivas del Agente de Código (BandManager.io / Bakandeya)

> **Contexto del Proyecto:** Esta aplicación es el núcleo técnico de un **Trabajo Fin de Máster (TFM) sobre Desarrollo de Software Asistido por Inteligencia Artificial Agéntica**.
> 
> **Misión:** Desarrollar la plataforma integral definitiva (**BandManager.io**) que todo músico y banda independiente necesita para automatizar su booking, logística, prensa, contenido en redes, repertorio y finanzas.

---

## ⚡ 1. Arquitectura General y Persistencia (CRÍTICO)

* **Única Fuente de Verdad (Single Source of Truth):** **Supabase (PostgreSQL)**.
* **Prohibición Estricta:** Google Sheets está **totalmente descartado y en desuso**. No se debe mencionar ni utilizar. Toda la persistencia (`leads`, `bands`, `users`, `tours`, `songs`, `finances`, `fans`, `social`, `autonomy_configs`, etc.) se gestiona exclusivamente a través de **Supabase**.
* **Estado en Memoria & Sincronización:** El backend Express mantiene un estado sincronizado (`server/state.ts` / `server/db.ts`) cargado desde Supabase (`loadStateFromSupabase`).
* **Migraciones de Esquema:** Cualquier modificación en la base de datos debe documentarse en SQL idempotente (`supabase/migrations/` o `supabase_schema.sql`).
* **Despliegue y Runtimes:** 
  - **Servidor Backend:** Express (TypeScript) corriendo en Node 22 (`server.ts`), desplegado principalmente en **Railway** (`railway.json`, `nixpacks.toml`, healthcheck `/api/health`).
  - **Frontend:** React 19 + Vite + Tailwind CSS v4 (`src/main.tsx` → `src/App.tsx`).

---

## 🔒 2. Seguridad, Multi-tenancy & Límite de Confianza (Trust Boundary)

### 2.1 Aislamiento Multi-inquilino Escrupuloso (Multi-tenancy Scoping)
1. **Límite de Confianza Obligatorio (`getTargetBandId`):**
   * Toda ruta del backend que manipule datos de una banda DEBE resolver el ID de la banda mediante **`getTargetBandId(req)`** (`server/utils/bandAccess.ts`).
   * **PROHIBIDO** leer `req.body.band_id`, `req.body.bandId` o la cabecera `x-band-id` directamente para autorizar operaciones de lectura/escritura.
2. **Confianza Cero en Capa de Datos (`server/db/*.ts`):**
   * Las funciones de acceso a datos (`dbUpsertX(objeto, bandId)`) deben usar ÚNICAMENTE el `bandId` resuelto por el middleware/sesión.
   * Queda estrictamente prohibido el patrón peligroso `cleanBandId(objeto.band_id || bandId)`. Existe una prueba estática en CI (`server/db/__tests__/bandIdTrustBoundary.test.ts`) que escaneará y fallará el build si se reintroduce este patrón.
3. **Filtros de Exportación Bulk:** Endpoints como `GET /api/download-excel` deben filtrar los resultados estrictamente por el `band_id` autenticado.

### 2.2 Seguridad API, Auth & Sanitización
1. **Autenticación y Middleware:** 
   * Las rutas protegidas deben aplicar `requireAuth` o `requireLeader` (`server/auth.ts`).
   * Las llamadas de cron/triggers de PostgreSQL usan `requireCronOrAuth` validado por el secreto `CRON_SECRET`.
2. **Protección de Endpoints de IA Generativa:**
   * Todo endpoint que consuma modelos de IA o consumo de cuotas pagadas (ej. `/api/generate-music` en `ai_music.ts` o `/write-reels-copy` en `chat.ts`) DEBE requerir `requireAuth` Y la tasa de limitación `iaRateLimiter` (`server/middleware/rateLimiter.ts`).
3. **Protección SSRF (Server-Side Request Forgery):**
   * Cualquier petición `fetch()` saliente realizada por el servidor a URLs provistas por usuarios (ej. scraping de webs de salas) DEBE pasar obligatoriamente por `esUrlExternaSegura` (`server/utils/ssrfGuard.ts`), que bloquea IP privadas/reservadas y re-valida DNS.
4. **Almacenamiento de Archivos (Supabase Storage):**
   * Los archivos estáticos y clips multimedia procesados deben subirse a **Supabase Storage**, nunca al disco efímero de Railway.
   * Servir uploads estáticos con cabeceras `X-Content-Type-Options: nosniff`.

### 2.3 Control de Planes de Suscripción y Límites Servidor/Cliente (Plan Promo)
1. **Jerarquía y Normalización de Planes (`normalizePlan`):**
   * El sistema soporta 5 niveles de suscripción: `promo` (Tier 0 - Calendario/QRs Fans/Dossier gratis), `ensayo` (Tier 1 - Noveles/Gratis), `local` (Tier 2 - Iniciación), `de_gira` (Tier 3 - Pro/Automatizado), `cabeza_de_cartel` (Tier 4 - Multi-banda/Agencias).
   * **Plan Promo (`promo`):** Diseñado para bandas que acuden a festivales o showcases y solo necesitan su Dossier EPK, QR de difusión, captación de base de fans (hasta 250 fans) y calendario, sin consumo de créditos IA ni acceso al booking CRM (`allowedModules: ['resumen', 'calendario', 'epk', 'fans']`).
2. **Validación Inflexible en Servidor (`server/utils/planLimits.ts`):**
   * Queda estrictamente prohibido confiar de forma exclusiva en la UI (`src/utils/planPermissions.ts`).
   * Toda mutación en API REST que cree registros (leads, medios, canciones, bandas, fans) DEBE validar los límites en el servidor con `checkRecordLimit(...)` para evitar que peticiones HTTP directas con token se salten el plan contratado.

---

## 🤖 3. Reglas de Negocio de Agentes IA (Human-in-the-Loop)

1. **Aprobación Humana Obligatoria para Envíos:**
   * La aplicación web lee y actualiza el estado en **Supabase**.
   * Los envíos de correo se realizan únicamente cuando el registro en Supabase pasa a estado `aprobado_propuesta` o `aprobado_respuesta`.
   * La aplicación web no dispara envíos directos no autorizados sin la aprobación explícita humana.
   * `dispatch_mode` (`autonomy_configs`) decide solo qué pasa DESPUÉS de esa aprobación (borrador en Gmail/IMAP para revisión final o despacho directo). Nunca omite la aprobación.
   * **Interruptor de Seguridad Global:** `AGENT_EMAIL_MODE=send` en variables de entorno del servidor. Si no está en `send`, el sistema actúa en modo seguro (`draft`).

2. **Modelo de Estados en 2 Dimensiones (CRM + Agentes IA):**
   * **Dimensión 1: Estado del Lead en el Embudo CRM (`estado`):**
     * `nuevo`: Lead registrado por el Scout o manualmente.
     * `contactado` / `esperando_respuesta`: Email inicial enviado.
     * `respondido`: La sala ha respondido; conversación activa.
     * `negociando`: Negociación de fechas, caché, taquilla o tech rider.
     * `confirmado`: Concierto cerrado; transferido a logística de gira y calendario.
     * `aplazado`: Programación llena o pospuesto para próxima temporada.
     * `no_interesado`: Descartado formalmente.
   * **Dimensión 2: Cola y Sub-estados Agénticos (Human-in-the-Loop):**
     * `pendiente_aprobacion`: Borrador generado por la IA esperando revisión del usuario.
     * `aprobado_propuesta`: Pitch inicial aprobado para despacho.
     * `aprobado_respuesta`: Réplica a la sala aprobada para despacho en hilo.
     * `borrador_creado`: Borrador depositado en Gmail/IMAP a la espera de envío.

3. **Ciclo de Vida de los Agentes de Booking:**
   * **Scout:** Descubre y enriquece salas en Supabase en estado `nuevo`.
   * **Redactor:** Genera propuesta personalizada en `pitch_generado` y marca sub-estado `pendiente_aprobacion`.
   * **Usuario (Human-in-the-Loop):** Valida o edita el texto y aprueba (`aprobado_propuesta` o `aprobado_respuesta`).
   * **Enviador** (`server/services/agentEngine.ts`): Despacha registros aprobados respetando la ventana comercial de la banda y rate-limits.
   * **Lector** (`server/services/lectorAgent.ts`): Monitoriza respuestas entrantes cada ~60s (vía Gmail OAuth2 o IMAP), actualiza `lead_messages` y detecta borradores de Gmail enviados manualmente.

4. **Conexión de Correo por Banda (Gmail OAuth2 vs IMAP):**
   * Cada banda conecta su propio buzón. El sistema prefiere automáticamente **Gmail OAuth2** (`band_gmail_oauth_accounts`) sobre IMAP/SMTP (`band_email_accounts`).
   * El componente unificado en el frontend para gestionar la conexión es `EmailAccountConfig.tsx`.

---

## 🎨 4. Subsistemas Especializados

1. **Reels & Social Content Generator (`server/routes/reels.ts` / `socialRadarService.ts`):**
   * Scrapea canales de la banda (YouTube, TikTok, Instagram) usando la API de YouTube o `yt-dlp`.
   * Filtra fragmentos virales analizando la energía del audio.
   * Almacena clips generados en **Supabase Storage**.
   * Utiliza el "Tone DNA" persistente y configurable por banda para generar copias alineadas con la identidad de la banda.

2. **AI Music & Sound Studio (`server/routes/ai_music.ts` / `src/utils/instrumentSynth.ts`):**
   * Genera pistas de acompañamiento y jingles utilizando modelos de Gemini (Lyria).
   * Genera bases rítmicas y sintetiza instrumentos (guitarra, violín, handpan, percusión) con `tone.js`.
   * Valida y repara notas generadas por la IA antes de la síntesis para evitar distorsiones de audio.
   * Exporta conceptos musicales a formato MIDI (`src/utils/midiExport.ts`).

3. **Campañas de Booking (`server/routes/campaigns.ts`):**
   * Gestión de campañas masivas segmentadas con scoping estricto por `band_id` resuelto en sesión.

---

## 🛠️ 5. Estándares de Código y Calidad (Fullstack)

### 5.1 Backend (Express + TypeScript)
* **Tipado Estricto:** Prohibido añadir nuevos errores a `npx tsc --noEmit` (baseline en CI = 0 errores en código nuevo). Evitar `any` implícitos.
* **Resiliencia ante Rechazos Asíncronos:** Mantener el handler global `unhandledRejection` en `server.ts` para evitar caídas del servidor Node ante fallos puntuales. Usar `try/catch` en todos los handlers asíncronos.

### 5.1.1 Testing (Vitest)
* **Estructura:** Tests en carpetas `__tests__/` adyacentes al código que prueban (ej: `server/utils/__tests__/bandAccess.test.ts`, no en un `tests/` central).
* **Estrategia:** Unit-testing de funciones puras exportadas contra objetos `req`/`loadState` falsos, sin usar HTTP client (`supertest`). Priorizar lógica de seguridad y multi-tenancy.
* **Ejecución:**
  ```bash
  npm test                          # Suite completa
  npx vitest run ruta/al/test.ts   # Un test específico
  npx vitest                        # Watch mode
  npm run test:coverage            # Reporte de cobertura
  ```
* **Cobertura Actual:** ~560 tests, 56 files. Áreas mejor cubiertas: `server/utils` (auth, multi-tenancy, SSRF) y `server/db` (band-scoping). Áreas débiles: `server/routes/*.ts` (handlers inline).
* **Priorización:** Seguridad > multi-tenancy > coverage puro. El patrón estático de `server/db/__tests__/bandIdTrustBoundary.test.ts` (regex sobre texto de archivo) vale para clases de bugs recurrentes.

### 5.2 Frontend (React 19 + Vite + CSS)
* **Diseño e Interfaz Premium:** Interfaces vibrantes con dark mode moderno, glassmorphism, micro-animaciones (`motion`), iconografía clara (`lucide-react`) y tipografía cuidada. Sin placeholders.
* **Consumo de API:** Todas las llamadas HTTP desde componentes deben canalizarse a través de `src/services/api.ts` o `src/utils/api.ts` (inyecta automáticamente JWT de auth y cabeceras `x-band-id`).
* **Excepción i18n:** El componente del EPK público (`/epk`) se renderiza fuera de `LanguageProvider` para prevenir que Google Translate altere nombres de canciones o bandas.

---

## 🧘 6. Simplicidad en Pantalla (REGLA TRANSVERSAL — aplica a TODA la app)

> Esta app hace **muchas** cosas (booking, agentes IA, reels, repertorio, finanzas, EPK, gira, fans...). Esa potencia solo es útil si **no satura la pantalla**. La complejidad vive en el backend y en la IA; la interfaz se mantiene minimalista. **Simplificar nunca significa perder funcionalidad: significa reubicarla.**

1. **El contenido primero, los metadatos después.** Lo primero que se ve al abrir una pantalla es aquello a lo que el usuario venía (el gráfico, la lista, el calendario), no el título, ni las estadísticas, ni los botones de acciones secundarias. Si el contenido principal queda por debajo del pliegue en móvil, el orden está mal.
2. **Móvil primero, de verdad.** Cada pantalla se diseña y se revisa a ~390 px de ancho. Un `flex-wrap` de badges que en escritorio ocupa 1 línea y en móvil se convierte en 6 **no es responsive**: es un layout de escritorio degradado. Cuando móvil y escritorio necesitan órdenes o densidades distintas, se usan layouts distintos (`hidden sm:flex` / `sm:hidden`, `order-*`), no uno solo que "más o menos" cabe.
3. **Presupuesto del primer viewport móvil:** como máximo **3 bloques** (una cabecera compacta + el contenido principal + un bloque más) antes de tener que hacer scroll. Todo lo demás va plegado.
4. **Acciones secundarias, detrás de un menú.** Compartir, imprimir, exportar, asignar, ajustes, configuraciones: en un único menú (`⋯` / `⚙️`), nunca como fila de botones de texto siempre visible. Regla práctica: si no se usa en la mayoría de las visitas a esa pantalla, no ocupa espacio permanente.
5. **Estadísticas: una línea de resumen + desplegable.** Nunca una batería de pills. Se muestran las 2-3 métricas que de verdad se miran (p. ej. `28 temas · 111m · 120 BPM`) y el resto se pliega bajo un toggle.
6. **Los textos de ayuda no viven en la pantalla.** Un hint largo entre paréntesis va al `title`/tooltip o desaparece. Si una función necesita un párrafo para entenderse, el problema es la función, no la falta de explicación.
7. **Ningún componente decorativo sin trabajo que hacer.** Badges que repiten información ya visible, títulos de sección obvios, contadores que nadie mira: fuera.
8. **Regla de intercambio al añadir:** antes de meter un elemento nuevo y permanente en una pantalla existente, hay que decir explícitamente qué se quita o dónde se pliega. La pantalla no crece por acumulación.
9. **Prohibido "simplificar" borrando capacidad.** Toda funcionalidad existente se conserva; se mueve a un menú, un desplegable, un modal o una vista secundaria. Si de verdad hay que eliminar algo, se pregunta antes.

---

## ⚡ 7. Eficiencia de Desarrollo y Economía de Tokens

1. **Lecturas Dirigidas:** No leas archivos completos de más de 300 líneas si solo necesitas modificar una función o interfaz específica. Usa `view_file` con rangos.
2. **Ediciones Quirúrgicas (Surgical Edits):** Usa bloques de reemplazo contiguos y mínimos (`replace_file_content`).
3. **Cero Salida Redundante:** Respuestas directas, concisas y orientadas a la acción.
4. **Control mediante Artefactos:** Registra planes en `implementation_plan.md`, listas de verificación en `task.md` y resúmenes de cambios en `walkthrough.md`.
