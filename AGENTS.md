# AGENTS.md — Instrucciones para agentes de código (BandManager.io / Bakandeya)

Plataforma integral para bandas y artistas independientes (booking CRM, agentes de IA, EPK, repertorio, finanzas) y núcleo técnico de un Trabajo Fin de Máster sobre desarrollo de software asistido por IA agéntica. Este documento tiene precedencia sobre convenciones genéricas — léelo antes de tocar el repositorio.

**No negociable, sin excepción:**
- Ningún dato de una banda visible para otra (§2.1).
- Ningún envío de email automatizado por un agente sin aprobación humana explícita (§3).
- Cero errores *nuevos* de TypeScript sobre el baseline de CI (§5.1) — la deuda existente no se exige arreglar de golpe, pero no crece.

**Índice:** 1. Arquitectura · 2. Seguridad y multi-tenancy · 3. Agentes IA · 4. Subsistemas · 5. Código y calidad · 6. Simplicidad en pantalla · 7. Eficiencia de desarrollo

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
   * Limitadores hermanos para otras superficies de abuso: `authRateLimiter`/`loginRateLimiter` (fuerza bruta en login) y `generalRateLimiter` (resto de la API).
3. **Protección SSRF (Server-Side Request Forgery):**
   * Cualquier petición `fetch()` saliente realizada por el servidor a URLs provistas por usuarios (ej. scraping de webs de salas) DEBE pasar obligatoriamente por `esUrlExternaSegura` (`server/utils/ssrfGuard.ts`), que bloquea IP privadas/reservadas y re-valida DNS.
4. **Almacenamiento de Archivos (Supabase Storage):**
   * Los archivos estáticos y clips multimedia procesados deben subirse a **Supabase Storage**, nunca al disco efímero de Railway.
   * Servir uploads estáticos con cabeceras `X-Content-Type-Options: nosniff`.
5. **`/security-review` antes de mergear, disparado por superficie tocada (no obligatorio siempre):** pasar la skill `/security-review` de Claude Code cuando el diff toca `band_id`/`bandAccess.ts`, auth, un `fetch()` de URL de usuario, subida de archivos, o el envío de emails de los agentes (§3). No es un checklist universal en cada merge — eso se acaba saltando por cansancio en un proyecto de iteración rápida, igual que la excepción de TDD (§5.3.1) tampoco es "todo con test antes"; es corrección/seguridad, no limpieza de código, así que vive aquí y no junto a `/code-review`/`/simplify` en §5.4.

### 2.3 Control de Planes de Suscripción y Límites Servidor/Cliente (Plan Promo)
1. **Jerarquía y Normalización de Planes (`normalizePlan`):**
   * El sistema soporta 5 niveles de suscripción: `promo` (Tier 0 - Calendario/QRs Fans/Dossier gratis), `ensayo` (Tier 1 - Noveles/Gratis), `local` (Tier 2 - Iniciación), `de_gira` (Tier 3 - Pro/Automatizado), `cabeza_de_cartel` (Tier 4 - Multi-banda/Agencias).
   * **Plan Promo (`promo`):** Diseñado para bandas que acuden a festivales o showcases y solo necesitan su Dossier EPK, QR de difusión, captación de base de fans (hasta 250 fans) y calendario, sin consumo de créditos IA ni acceso al booking CRM (`allowedModules: ['resumen', 'calendario', 'epk', 'fans']`).
2. **Validación Inflexible en Servidor (`server/utils/planLimits.ts`):**
   * Queda estrictamente prohibido confiar de forma exclusiva en la UI (`src/utils/planPermissions.ts`).
   * Toda mutación en API REST que cree registros (leads, medios, canciones, bandas, fans) DEBE validar los límites en el servidor con `checkRecordLimit(...)` para evitar que peticiones HTTP directas con token se salten el plan contratado.

### 2.4 Blindaje Anti-Sabotaje, Protección de Propiedad Intelectual (IP) y Ciberseguridad Defensiva
1. **Custodia Criptográfica de la Obra Musical (Derechos de Autor):**
   * Las maquetas inéditas, stems aislados, pistas multipista, letras y grabaciones de ensayo son propiedad exclusiva e inalienable del músico.
   * Queda prohibido exponer URLs directas o predecibles sin validación de pertenencia a la banda (`band_id` autenticado mediante sesión JWT).
   * El almacenamiento en Supabase Storage debe respetar la jerarquía `stems/{bandId}/{songHash}/...` con políticas RLS y rutas acotadas para evitar accesos cruzados o fugas de material no publicado.
2. **Defensa contra Espionaje Comercial y Scraping Malicioso:**
   * La base de datos de salas, contactos privados de programadores, cachés de negociación, contratos, cachés de tarifas y agendas de gira son activos estratégicos de alto valor.
   * Los endpoints de exportación masiva (`/api/download-excel`, `/api/export-leads`) deben aplicar *rate limiting* estricto y scoping intransigente por `band_id` para neutralizar intentos de exfiltración masiva por competidores o agencias externas.
3. **Inmunidad contra Sabotaje y Ataques Web (Hardening Integral):** rate limiting y SSRF ya cubiertos en §2.2.2/§2.2.3 (no se repiten aquí). Lo que añade este punto:
   * **Prevención de Inyecciones (SQLi, NoSQLi, XSS):** Todas las consultas a Supabase se canalizan parametrizadas mediante el cliente tipado oficial o funciones de sanitización.
   * **Sanitización de Archivos y Path Traversal:** Validadores dedicados (`subcarpetaSegura`, `rutaFuenteSegura`) impiden la manipulación de rutas en el sistema de archivos del servidor.

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

4. **Facturación y Ledger de IA (`server/routes/billing.ts`, `server/routes/donations.ts`, `server/db/aiLedger.ts`):**
   * Checkout y webhooks de Stripe (cambios de plan, suscripciones), donaciones (Ko-fi) y el ledger de consumo de IA por banda.
   * Junto con el aislamiento por `band_id` (§2.1), es la única área con excepción obligatoria de TDD (test del caso límite antes que el código) — ver §5.3.1.

---

## 🛠️ 5. Estándares de Código y Calidad (Fullstack)

### 5.1 Backend (Express + TypeScript)
* **Tipado Estricto:** Prohibido añadir nuevos errores a `npx tsc --noEmit` (baseline en CI = 0 errores en código nuevo). Evitar `any` implícitos.
* **Resiliencia ante Rechazos Asíncronos:** Mantener el handler global `unhandledRejection` en `server.ts` para evitar caídas del servidor Node ante fallos puntuales. Usar `try/catch` en todos los handlers asíncronos.

### 5.2 Frontend (React 19 + Vite + CSS)
* **Diseño e Interfaz Premium:** Interfaces vibrantes con dark mode moderno, glassmorphism, micro-animaciones (`motion`), iconografía clara (`lucide-react`) y tipografía cuidada. Sin placeholders.
* **Consumo de API:** Todas las llamadas HTTP desde componentes deben canalizarse a través de `src/services/api.ts` o `src/utils/api.ts` (inyecta automáticamente JWT de auth y cabeceras `x-band-id`).
* **Excepción i18n:** El componente del EPK público (`/epk`) se renderiza fuera de `LanguageProvider` para prevenir que Google Translate altere nombres de canciones o bandas.

### 5.3 Testing — fullstack, no solo backend (por eso vive aparte de §5.1)

#### 5.3.1 Vitest (unit)
* **Estructura:** Tests en carpetas `__tests__/` adyacentes al código que prueban (ej: `server/utils/__tests__/bandAccess.test.ts`, no en un `tests/` central).
* **Estrategia:** Unit-testing de funciones puras exportadas contra objetos `req`/`loadState` falsos, sin usar HTTP client (`supertest`). Priorizar lógica de seguridad y multi-tenancy.
* **Ejecución:**
  ```bash
  npm test                          # Suite completa
  npx vitest run ruta/al/test.ts   # Un test específico
  npx vitest                        # Watch mode
  npm run test:coverage            # Reporte de cobertura
  ```
* **Tests:** número vivo — correr `npm test` para el real (no fiarse de una cifra escrita aquí, caduca en el próximo commit).
* **La cobertura real tiene una trampa — mide el backend, no el proyecto:** `npm run test:coverage` da ~36% de statements, pero ese % es solo sobre los ficheros que algún test llega a importar. Ni un componente React ni un hook aparecen en el reporte (0 de 150 ficheros de `src/components/`, ~96.770 líneas) — el bloque sin medir es casi el doble del que sí se mide (~50.870 líneas de backend+utils). No leer ese % como "cobertura del proyecto".
* **Dentro de lo medido:** `server/utils` está bien cubierto de verdad. `server/db` NO en conjunto — solo `core.ts` (`cleanBandId`/`normalizePlan`) lo está, más el escáner estático de `bandIdTrustBoundary.test.ts`, que protege el patrón peligroso sin necesitar ejecutar el archivo (no suma % pero sí protege). El resto de `server/db` y todo `server/routes/*.ts` están al nivel de "sin cubrir" — ver más abajo para cuándo eso importa de verdad.
* **Excepción de TDD (`band_id`/dinero, ver más abajo) — estado real:** `bandAccess.ts` y `server/db/aiLedger.ts` la cumplen (ver `server/db/__tests__/`). `billing.ts`/`donations.ts` (Stripe/Ko-fi) todavía no — pendiente. Investigación completa de cómo se llegó a este diagnóstico: commits `5b16d39`/`ef403f4`.
* **Por qué esas áreas están débiles — testability, no pereza:** `server/utils`/`server/db` están mejor cubiertos porque son funciones puras exportadas, fáciles de testear contra un `req`/`bandId` falso; `server/routes/*.ts` está peor cubierto porque mezcla lógica de negocio directamente con `req`/`res` de Express dentro del propio handler — no es que falte tiempo, es que esos handlers no se pueden testear sin levantar el servidor entero. **Extraer a una función pura testeable (patrón `bandAccess.ts`) cuando:** (a) el handler hace algo más que parsear el request y delegar — cálculo, validación con varias ramas, transformación de datos; (b) toca `band_id` o dinero (excepción de TDD más abajo — sin algo testeable no hay nada que testear antes de tocar el código); (c) el síntoma más simple — si no puedes escribir el test sin arrancar Express, esa es la señal, no una excusa para saltártelo.
* **Priorización:** Seguridad > multi-tenancy > coverage puro. El patrón estático de `server/db/__tests__/bandIdTrustBoundary.test.ts` (regex sobre texto de archivo) vale para clases de bugs recurrentes.
* **TDD selectivo (no obligatorio salvo en dos áreas):** TDD estricto (test antes que código) NO es la norma en este proyecto — la velocidad de iteración depende de poder arreglar un bug o probar una idea en minutos, y aquí se cambia de diseño a media implementación con frecuencia, lo que dejaría obsoleto un test escrito primero junto con el código que describía. El estándar general sigue siendo el actual: tests escritos junto al fix o la feature, no antes.
  * **Excepción obligatoria — aislamiento multi-banda (`band_id`/RLS) y todo lo que toca dinero (Stripe, ledger de IA — ver §4.4):** aquí sí se escribe el test del caso límite **antes** de tocar el código. Un bug en estas dos áreas no es un fallo visual, es "una banda ve datos de otra" o "se cobra mal".
  * En ambas, el test debe verificar un **invariante**, no la implementación de hoy (ej. "ninguna query devuelve filas de otro `band_id`", "el ledger nunca queda negativo sin un evento que lo explique"), siguiendo el patrón de escaneo estático de `bandIdTrustBoundary.test.ts` en vez de un mock atado a una función concreta — así el test sigue protegiendo aunque la implementación cambie por completo.

#### 5.3.2 E2E (Playwright) — smoke suite mínimo, no cobertura completa
* **Por qué solo "smoke" (+ un journey):** la UI de esta app cambia de sitio constantemente (rebrands, rediseños de pantallas enteras en días). Un E2E que cubra visualmente todo el flujo se rompería a menudo por cosas que no son bugs, y con un solo desarrollador eso lleva a silenciar tests en vez de arreglar código real. Por eso `e2e/` cubre solo lo que, si se rompe, es grave y no lo detectarías con un test unitario mockeado: `health.spec.ts` (healthcheck que usa Railway para decidir si el deploy está vivo), `auth.spec.ts` (login real contra un usuario semilla, no un mock de auth), `epk-public.spec.ts` (la única ruta pública de la app — si se rompe, las salas no pueden ver el dossier y se pierden leads sin que nadie se entere).
* **Journey test (`onboarding-journey.spec.ts`):** a diferencia de los smoke de arriba (una acción aislada cada uno), este encadena el flujo completo de alguien nuevo — registro → asistente de configuración inicial de 12 pasos (`OnboardingWizardModal`, se dispara solo en el primer login) → panel funcionando. Crea una banda real distinta en cada corrida (sufijo con timestamp) para no chocar con ejecuciones anteriores. Es el candidato natural a journey test en esta app porque es la única secuencia multi-paso que se puede probar sin credenciales de IA/email/Stripe — el otro journey obvio (lead → aprobación humana → borrador del Enviador, el subsistema más crítico del negocio, ver §3) queda pendiente hasta decidir cómo evitar gastar cuota real de Gemini en cada corrida de CI.
* **Corre sin credenciales:** `npm run test:e2e` arranca el servidor de dev (`npm run dev`) sin `SUPABASE_URL`/`STRIPE_SECRET_KEY`/`GEMINI_API_KEY` configurados — la app arranca igual, y el login del test funciona contra los usuarios semilla de `src/db_seed.ts` (`diego` / `bakandeya2026`) porque la sincronización con Supabase en `/auth/login` está en `try/catch` y sigue con el estado en memoria si falla. No añadir aquí ningún test que dependa de Stripe/Gemini/SMTP reales sin antes confirmar que hay secretos de un proyecto de pruebas configurados en CI — si no, se queda en verde por accidente o roto por accidente, ninguna de las dos cosas vale.
* **Selectores estables:** usar `getByPlaceholder`/`getByRole` sobre el texto visible, no clases CSS (cambian en cada rediseño). El selector del panel autenticado usa un `title` fijo del componente, no el nombre de la banda ni el logo.
* **Page Object Model / fixtures — deliberadamente NO implementado todavía:** con 3 specs y un único test haciendo login, sería abstraer antes de que haga falta. **Disparador para añadirlo:** en cuanto un SEGUNDO archivo de `e2e/` necesite sesión iniciada, extraer un fixture de login reutilizable (`test.extend`, no una clase POM clásica — más simple para el nivel del proyecto) en ese mismo commit, no antes. Si añades ese segundo test, hazlo ahí mismo.
* **En CI (`.github/workflows/ci.yml`):** paso separado con `continue-on-error: true` hasta confirmar un par de runs en verde en GitHub Actions real (solo se verificó dentro del entorno de Claude Code al escribirse) — quitarlo entonces para que bloquee igual que `tsc`/`eslint`/`vitest`.

### 5.4 Code smells — hábito de revisión, no un "sistema" nuevo
* **Qué es y qué NO es:** un code smell no es un fallo de comportamiento (eso lo pillan los tests) — es código que funciona pero está mal diseñado y va a morder más adelante: duplicación, funciones/componentes enormes, parámetros booleanos que cambian el comportamiento entero, abstracciones que nadie usa, código muerto. No hace falta montar tooling nuevo para esto: ya existen dos capas.
* **Capa 1 — ESLint (`npm run lint:eslint`):** ya cubre parte (`no-explicit-any`, `no-unused-vars`, hooks mal usados). La deuda existente (~2816 hallazgos) va con ratchet en CI — no crece, no se arregla toda de golpe (ver comentario en `.github/workflows/ci.yml`).
* **Capa 2 — hábito antes de cada merge grande:** pasar la skill `/code-review` (bugs + limpieza) o `/simplify` (solo limpieza: reutilización, simplificación, eficiencia) de Claude Code sobre el diff antes de mergear algo grande a `develop`. No es un paso automático de CI — es un hábito manual, a criterio de quien merge.
* **Dead code — deliberadamente sin tooling (`knip`/`ts-prune`) todavía:** ESLint solo pilla variables/imports locales no usados, no exports sin uso entre archivos. No se instala una herramienta de detección automática porque en este proyecto genera falsos positivos: hay código deliberadamente dormido detrás de un flag (ej. `LoginModal.tsx` completo, escondido tras `USE_SIMPLE_LOGIN = true` en `App.tsx`, conservado a propósito para cuando se reabra el registro con los 4 planes) que una herramienta automática marcaría como muerto sin estarlo. Revisar dead code real sigue siendo manual, vía `/code-review`/`/simplify`.
* **Type code de estado del lead — resuelto:** `src/utils/leadStatusPresentation.ts` es la única fuente para color/etiqueta del estado del lead, usada por `BookingCRM.tsx` y `Dashboard.tsx` (antes duplicado entre ambos con valores distintos — la versión de `Dashboard.tsx` no pintaba varios estados en móvil, bug real, no solo smell). Investigación completa: commit `c80789f`.
* **Boy Scout Rule — sí, pero con límite explícito:** al tocar un archivo por otra razón (bug, feature), dejar una mejora pequeña al paso es el mecanismo natural para que baje la deuda de ESLint sin necesitar nunca un sprint de limpieza dedicado. Límite, para que no choque con "no añadas limpieza que nadie pidió" de más arriba: **sí** dentro del mismo archivo/función que ya se está tocando por la tarea real, y **solo si es mecánico y pequeño** (rename, quitar código muerto que ya tienes delante, deduplicar 3-4 líneas); **no** saltar a un archivo no relacionado "ya que estoy", y **no** usarlo para inflar un fix de 5 líneas a un PR de 200.
* **Refactor seguro — cómo, no solo cuándo:** el Boy Scout Rule dice cuándo limpiar al paso; esto dice cómo no cargarse nada mientras se hace, y es doblemente importante porque quien hace la mayoría de los cambios en este repo es un agente de IA — el fallo típico es tocar la lógica a la vez que se reordena el código, y como el diff parece solo cosmético, nadie lo revisa con la atención de un cambio funcional.
  * **Nunca mezclar refactor y cambio de comportamiento en el mismo commit.** Si cambian a la vez qué hace el código y cómo está organizado, cuando algo se rompe no se sabe cuál de las dos cosas fue la causa.
  * **Tests en verde antes y después de cada paso**, no solo al final. Sin test que lo cubra, un "refactor seguro" no existe — es una reescritura a ciegas con nombre bonito. Para código sin test previo en zona no crítica (UI, por ejemplo), verificación manual explícita basta; en `band_id`/dinero (§5.3.1) hace falta el test antes de tocar nada, igual que para cualquier otro cambio ahí.
  * **Pasos pequeños y mecánicos** (extraer función, renombrar, mover) en vez de una reescritura grande de una sentada — cada paso revertible por separado.
  * Ejemplo aplicado: el refactor de `leadStatusPresentation.ts` (ver arriba) — commit aparte, sin tocar lógica de negocio, verificado 1:1 contra el código original antes de mergear.

### 5.5 Quality gate local (Husky + lint-staged)
* **Qué hace:** `.husky/pre-commit` corre `lint-staged`, que ejecuta `eslint --fix` solo sobre los `.ts`/`.tsx` que se van a commitear — milisegundos, no minutos. Pilla typos y errores reales (`no-unused-vars`, etc.) antes de que salgan de la máquina.
* **Por qué no repite lo que ya hace CI:** `tsc`/`eslint` completo/`vitest`/E2E siguen viviendo solo en `.github/workflows/ci.yml`. Correrlos también en cada commit local frenaría la iteración sin aportar nada que CI no detecte igual en el push.
* **Escape hatch:** `git commit --no-verify` salta el hook para un commit puntual (ej. un WIP que sabes que no compila del todo). Úsalo con criterio, no como costumbre.
* **A prueba de romper el deploy:** el script `prepare` (`"husky || exit 0"`) nunca hace fallar `npm ci`/`npm install` aunque no se puedan instalar los hooks (ej. un build de Railway sin `.git` disponible) — la instalación de dependencias nunca depende de que Husky funcione.

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

1. **Lecturas dirigidas:** en un archivo largo, leer solo el rango de líneas relevante cuando la herramienta lo permita, no el archivo entero, si solo hace falta tocar una función o interfaz concreta.
2. **Ediciones quirúrgicas:** diffs mínimos y contiguos sobre el archivo existente, no reescrituras completas salvo que el cambio lo justifique.
3. **Cero salida redundante:** respuestas directas, concisas y orientadas a la acción.
4. **Sin documentos de planificación por defecto:** no crear `.md` de plan/tareas/resumen de cambios (`implementation_plan.md`, `task.md`, `walkthrough.md`...) a menos que se pida explícitamente — ni existen en este repo ni encajan con cómo trabaja Claude Code por defecto; la herramienta de seguimiento de tareas nativa del agente (cuando exista) cumple esa función sin ensuciar el repo con archivos que nadie vuelve a abrir.

---

## ⚖️ 8. Riesgos Legales Detectados — Pendientes de Mitigar (auditoría 2026-09-16)

> Esta sección existe para que estos flecos no se pierdan entre commits. `TERMS_OF_SERVICE.md` protege la propiedad intelectual del código frente a terceros, pero **no cubre nada de lo de abajo** — eso es sobre cómo la app trata datos y contenido de terceros, y es responsabilidad de quien opera el servicio, no del texto legal del repo. No bloquea el desarrollo del TFM; sí bloquea pasar a producción con usuarios reales sin resolver al menos los dos puntos 🔴.

1. 🔴 **Descarga de YouTube sin verificar titularidad (`server/routes/concert_to_album.ts`, `server/routes/reels.ts`, `server/utils/youtubeSource.ts`):**
   * Usan `ytdl-core`/`yt-dlp` con banderas anti-bot y gestión de cookies explícitas para saltarse los bloqueos de YouTube (comentarios propios en el código lo documentan: "el que se comía los bloqueos antibot de YouTube").
   * Incumplimiento de los ToS de YouTube por diseño, y si la URL introducida no es contenido propio del usuario, **infracción de copyright** al descargar/reprocesar/redistribuir el clip.
   * Hoy no hay ninguna verificación de que el vídeo pertenezca al usuario (ni checkbox de titularidad, ni comprobación de canal propio).
   * **Mitigación mínima antes de producción:** exigir confirmación explícita de titularidad del contenido antes de procesar, y valorar restringir a canal propio verificado.

2. 🔴 **Credenciales de email en texto plano (`server/db/emailAccounts.ts`):**
   * El `app_password` de Gmail de cada banda se guarda sin cifrar en Supabase. Solo se excluye de las respuestas HTTP (`const { app_password, ...safe } = account`), no se cifra en reposo.
   * Da acceso de lectura/escritura completo al buzón conectado. Una fuga de esa tabla compromete el correo de todas las bandas conectadas — expuesto directamente al régimen sancionador del art. 32 RGPD (deber de seguridad en el tratamiento).
   * **Mitigación mínima:** cifrar `app_password` en reposo (AES con clave en variable de entorno, como mínimo) antes de manejar cuentas de bandas reales, no solo de prueba.

3. 🟠 **Emails comerciales automatizados sin mecanismo de baja (`server/routes/leads/pitch.ts`, `server/services/emailAgentClient.ts`, `server/services/agentEngine.ts`):**
   * El pipeline de outreach a salas/festivales no incluye enlace ni gestión de baja (`unsubscribe`) visible en el código.
   * La LSSICE (art. 21, España) exige opción de baja en toda comunicación comercial no solicitada; sanción de hasta 30.000€ por infracción grave.
   * **Mitigación:** añadir enlace/mecanismo de baja y registrar el opt-out por lead antes de escalar el volumen de envíos.

4. 🟠 **Scraping de redes sociales con user-agent falseado (`server/services/socialRadarService.ts`):**
   * `scrapeChannelMetrics` suplanta un navegador real (`User-Agent` de Chrome hardcodeado) para leer Instagram/TikTok/YouTube.
   * No es delito, pero incumple los ToS de esas plataformas → riesgo de bloqueo de IP/cuenta de la banda, no de sanción legal.
   * **Mitigación:** documentar el riesgo de bloqueo al usuario, y preferir APIs oficiales donde existan en vez de scraping cuando el volumen crezca.

5. 🟠 **Datos personales de contactos de salas/festivales sin base de legitimación documentada (`server/routes/leads/enrichment.ts`, `places.ts`):**
   * Nombre, email y teléfono de personas de contacto de salas se scrapean, enriquecen y almacenan como parte del lead. Son datos personales de terceros (no solo datos de la entidad "sala"), tratados sin una base de legitimación RGPD explícita en el propio sistema (interés legítimo probablemente aplicable, pero no documentado).
   * **Mitigación:** documentar la base de legitimación (interés legítimo B2B) en una política de privacidad real, y ofrecer vía de baja/oposición al tratamiento.

**Ya resuelto correctamente, no tocar sin razón:** `PublicFanCapture.tsx` sí implementa checkbox de consentimiento RGPD explícito (`consentimientoRGPD`) antes de capturar el email de un fan — usar ese componente como referencia de patrón cuando se añadan otros formularios de captación de datos de terceros.
