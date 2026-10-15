# BandManager.io — análisis por especialidades

Revisión de solo lectura hecha por cinco revisores (arquitectura, frontend, IA, seguridad/DevOps, calidad). Cada punto es **V** (verificado con comando) o **S** (sospecha). Los hallazgos de mayor peso los comprobé yo después de recibir los informes.

Nota de formato: no conozco la composición real del profesorado de ningún máster, así que no atribuyo opiniones a personas. Cada bloque es la mirada de una especialidad; el apartado «Senior generalista» resume el enfoque práctico.

Base: ~318k líneas TS (223k en `src/`, 85k en `server/`), 377 ficheros de test, TS sin `strict`, 94 monolitos >600 líneas, cobertura global ~25%.

---

## 1. Arquitectura y backend

| Impacto · Esf. | Hallazgo | Evidencia | Propuesta |
|---|---|---|---|
| Alto · L | **V.** El estado entero se serializa a `data.json` de forma síncrona en cada `saveState` (104 llamadas, 154 `loadState`). Estado en memoria por proceso, sin lock ni versión: peticiones concurrentes o dos instancias se pisan. Choca con «Supabase es la fuente de verdad» (AGENTS.md §1). | `server/state.ts:998-1003` | Migrar por dominio a tablas Supabase; mientras tanto cola serializada y réplicas=1 documentado. |
| Alto · M | **V.** Sin validación de entradas (no hay zod). `bands.ts:111` guarda `req.body` entero; `bands.ts:155` hace `{...req.body, id}` (asignación masiva); `bands.ts:143` pasa el body a la BD. | `server/routes/bands.ts` | Zod + middleware `validar(schema)`; empezar por bands, agent y billing. Los esquemas alimentarían OpenAPI. |
| Alto · S | **V.** Decenas de respuestas 5xx incluyen `err.message` (el recuento exacto varía según el patrón: 48 con el patrón del revisor, 147 con uno más amplio). | grep sobre `server/` | `ErrorHttp` + handler global con mensaje genérico e id de correlación; regla de lint. |
| Medio · M | **V.** Contrato de respuesta incoherente (330 `{error}` vs 302 `{success}`), 26 `.catch(() => null)` que tragan errores. | grep | Contrato único `{error:{code,message}}`. |
| Alto · L | **V.** Ficheros dios en rutas con lógica de negocio: `leads/enrichment.ts`, `concert_to_album.ts`, `agent.ts`, `db/repertoire.ts`, `state.ts`. | `scripts/tamano-baseline.json` | Patrón ruta fina → servicio → db. |
| Medio · M | **V.** 9 dependencias circulares (`madge`); la capa `db` importa servicios. | `npx madge --circular` | Invertir dependencia; `madge` en CI con baseline. |
| Medio-Alto · M | **V.** Los planificadores usan `setInterval` de 24 h sin persistir la última ejecución: cada deploy reinicia el reloj. **S:** con varias instancias se duplican. | `agentScheduler.ts:16,167` | Tabla `scheduler_runs` + advisory lock. |
| Medio · M | **V.** Migraciones en tres mecanismos (47 en `supabase/migrations`, 11 `migration_*.sql` sueltos, 2 SQL en la raíz). Deriva real código↔esquema (`20261102_columnas_escritas_sin_migracion.sql`). | `ls supabase/` | Una sola fuente y un test que compare columnas usadas con el esquema. |
| Medio · M | **V.** Sin versionado de API, paginación casi ausente (26 usos de `limit/range`), idempotencia solo en el webhook de Stripe y en memoria. | grep | Cursor en listados; `Idempotency-Key` en POST que cobran o envían correo. |

## 2. Frontend, UX, accesibilidad y rendimiento

| Impacto · Esf. | Hallazgo | Evidencia | Propuesta |
|---|---|---|---|
| Alto · S | **V.** El build sale **sin minificar** y sin sourcemaps. | `vite.config.ts:43-45` | `minify:'esbuild'`; sourcemaps ocultos subidos a Sentry. Medir antes/después. |
| Alto · M | **V.** Un contexto monolítico de ~190 campos; vistas con 40+ props; solo 1 `memo(`. **S:** re-renders amplios (medir con Profiler antes de dividir). | `useAppController.ts:121`, `ActiveViewRouter.tsx:21` | Contextos por dominio o selectores. |
| Alto · M | **V.** Sin URLs por vista: Atrás del móvil saca de la app, sin deep links. | `useAppNavigation.ts:66,137` | Sincronizar con `history`/`popstate` (~40 líneas). |
| Alto · M | **V.** Recarga automática en `controllerchange` que puede tirar un Atril o ensayo en curso; sin `vite:preloadError`. | `main.tsx:43-58` | No recargar con modo en vivo/grabación activo; aviso «nueva versión». |
| Alto · M | **V.** Offline casi inexistente para el directo; `/api/` nunca se cachea. | `sw.js` | Guardar setlist y letras activos en IndexedDB al abrir Atril. |
| Medio · M | **V.** 135 ficheros con `fixed inset-0`, solo 8 con `role="dialog"`/`aria-modal`; poca trampa de foco. | grep | Un componente `<Modal>` único. |
| Medio · L | **V.** i18n parcial: ES/EN con 136 líneas; el resto depende del widget de Google Translate, que altera el DOM de React. | `src/context/translations` | Decidirlo como política de producto y documentarlo. |
| Bajo · S | **V.** 3 `<img>` sin `alt`, 11 clics sin semántica; sin `eslint-plugin-jsx-a11y`. | grep | Añadir el plugin a CI. |
| — | **V.** Incumplimientos de visual-identity: 248 `border`, 71 colores Tailwind fuera de la paleta del módulo, 24 `uppercase`. Dato favorable: solo 2 `backdrop-blur`. | grep | Barrido por módulo. |

## 3. Ingeniería de IA / LLMs

| Impacto · Esf. | Hallazgo | Evidencia | Propuesta |
|---|---|---|---|
| Alto · M | **V.** `/chat` solo lleva `requireAuth` (sin `iaRateLimiter`) y no hay `maxOutputTokens` en todo el servidor (0 resultados). Historial y mensaje sin tope. | `chat.ts:28` | Limitador, tope de turnos y de longitud, `maxOutputTokens` por caso de uso. |
| Alto · M | Sin tope por banda; solo 10 de 67 llamadas pasan `bandId` (~85% del gasto sin atribuir). El buffer del ledger está en memoria. | `aiLedger.ts:29-31` | `bandId` obligatorio + cuota mensual por banda. |
| Alto · M | Salida estructurada frágil: ~66 `JSON.parse`/regex, 28 `responseMimeType` pero 1 `responseSchema`. | grep | `generateJson<T>(schema)` con reintento. |
| Alto · S | El respaldo a DeepSeek reenvía texto plano sin modo JSON, con 1500 tokens por defecto, y manda datos de bandas y leads a un tercero. | `ai.ts:289-309` | Modo JSON, saltarlo con tools/multimodal, documentar en la política de privacidad. |
| Medio · S | **S:** modelos obsoletos en `FALLBACK_MODELS` y precios del ledger que quizá no corresponden al modelo real. | `ai.ts:17-22` | Config única modelo↔precio. |
| Medio · M | Sin golden sets ni evals de prompts (solo `eval:acordes`); 51 tests mockean la IA. | `scripts/evaluar-acordes.ts` | Golden set de 30-50 casos y `npm run eval:llm`. |
| Medio · M | Prompts inline y sin versionar; `sanitizeExternalText` solo en 7 ficheros (**S** para el resto). | grep | Módulos con constante de versión. |
| Positivo | Aprobación humana en el chat (`propose_*`), tope diario de envíos, timeouts de 60 s, killswitch de gasto. | `chatTools.ts`, `agentEngine.ts:61` | — |

## 4. Seguridad, multi-tenant y DevOps

| Impacto · Esf. | Hallazgo | Evidencia | Propuesta |
|---|---|---|---|
| Positivo | **Verificado sin huecos explotables** en el barrido de aislamiento por banda: `getTargetBandId` solo acepta la banda pedida si pertenece al usuario; las 9 lecturas directas de `bandId` tienen un control compensatorio. Cuenta como «sin hueco verificado», no como prueba absoluta. | `bandAccess.ts:22-47` | — |
| Alto · M | **V.** Cookie de sesión `httpOnly:false` (decisión **documentada** en el código y en BACKLOG: el cliente la lee). Sesión de 30 días en el JSON de estado. **S:** sin revocar al cambiar la contraseña. | `rutasLogin.ts:173-175` | Migrar a sesión solo por cookie; hash del token; revocar al cambiar contraseña. |
| Alto · S | **V.** CI sin `npm audit` ni escaneo de secretos. | `.github/workflows` | `npm audit --omit=dev` + gitleaks. |
| Alto · S | **V.** Tres configuraciones de build (`railway.json`, `nixpacks.toml`, `railpack.json`). **S:** `nixpacks.toml` sería código muerto; instalación sin `npm ci`. | raíz | Una sola, `npm ci`, `builder` explícito. |
| Medio · M | **V.** `/api/health` devuelve 200 sin comprobar la BD. | `server.ts:165-175` | `/ready` con ping a Supabase. |
| Medio · S | **V.** Sentry front sin sourcemaps; back con `tracesSampleRate:0`; sin `trust proxy` en `server.ts`. | `vite.config.ts:43` | Sourcemaps, alertas 5xx, `trust proxy`. |
| Medio · M | Rate limiter en memoria: se multiplica con réplicas. | `rateLimiter.ts:6` | Store compartido si se escala. |
| Medio · S | Entornos de preview por PR con coste (confirmado por Railway). | — | Desactivarlos o limitarlos por etiqueta. |
| Bajo | PII en logs (email del reseteo de contraseña, 49 `console.*` con token/email/secret), clave Firebase versionada (no secreta, restringir). | `rutasRecuperacion.ts:180,193` | Logger con redacción. |

## 5. Calidad, testing y proceso

| Impacto · Esf. | Hallazgo | Evidencia | Propuesta |
|---|---|---|---|
| Alto · M | **V.** E2E con `continue-on-error: true` y sin flujos de pago, pitch ni Atril en directo (8 specs). | `ci.yml:131` | Quitarlo y añadir 3 specs. |
| Alto · S | **V.** Umbrales globales 22/19/17/22 sin suelo por módulo crítico (auth, billing, bandAccess, agentEngine). | `coverage-thresholds.json` | Umbrales por carpeta. |
| Alto · L | **V.** `tsc --strict` da **963 errores** (~85% `strictNullChecks`; 640 en `src/components`). Estimación del revisor: 3-5 días por fases. | `tsc --strict` | `tsconfig.strict.json` por carpetas con ratchet; servidor primero. |
| Medio · S | **V.** Test intermitente por temporizadores de `googleTranslate.ts` sin limpiar. | `:68,96,114` | Limpiar timers y fake timers. |
| Medio · M | **V.** 35 ficheros de test leen el código como texto (9%). Muestra: ~55-65% comportamiento real, ~25-30% mock-pesado. | grep | Sustituir por render real. |
| Medio · S | **V.** `skills/` en 4 copias (589 ficheros). | `git ls-files` | Una sola fuente y generar espejos. |
| Medio · M | **V.** 1.556 `.md` del grafo versionados y regenerados en cada PR. | `docs.yml:43` | Generarlos en CI como artefacto. |
| Medio · M | CI en un único job secuencial; sin caché de Playwright. | `ci.yml` | Jobs paralelos y shards. |
| Bajo · S | `presentacion/` (22 MB) y 2 SQL en la raíz; 15% de commits fuera de Conventional Commits. | `git ls-files` | Moverlos fuera. |

---

## Senior generalista: qué haría y en qué orden

**Semana 1 — apagar riesgos baratos (todo S):**
1. `iaRateLimiter`, tope de historial y `maxOutputTokens` en `/chat`.
2. `minify` + sourcemaps ocultos a Sentry.
3. Quitar `err.message` de los 5xx con `ErrorHttp` + handler global.
4. Arreglar el timer de `googleTranslate.ts` (CI estable).
5. `npm audit` + gitleaks en CI; unificar el build de Railway.
6. Desactivar o limitar los entornos de preview por PR.

**Semana 2-3 — cimientos (M):**
7. Zod + `validar(schema)` en `bands`, `agent`, `billing`.
8. Persistencia de planificadores (`scheduler_runs` + advisory lock).
9. Cuota de IA por banda y `bandId` obligatorio en el ledger.
10. `history` para la navegación y no recargar durante Atril/ensayo.
11. Umbrales de cobertura por módulo crítico y E2E de checkout bloqueante.

**Meses — deuda estructural (L):**
12. Sacar el estado de `data.json` a Supabase por dominio.
13. `strict` por fases con ratchet.
14. Sesión solo por cookie `httpOnly`.
15. Troceo de los 5 monolitos más dañinos.

## Cautelas
- Los recuentos (`grep`) cuentan usos, no rutas ni errores únicos; el del 5xx varía según el patrón.
- Las afirmaciones sobre varias instancias son inferencias del código, no están probadas.
- El revisor de frontend no pudo construir, así que la ganancia de minificar es una hipótesis hasta medirla.
- El revisor de IA no leyó AGENTS.md ni los SKILL.md; alguna recomendación puede chocar con convenciones del repo.
- La cookie `httpOnly:false` es una decisión consciente y documentada, no un descuido; el coste es migrar el cliente.

---

# Por perfiles (lente de cada especialidad)

Cada bloque aplica la especialidad del perfil indicado, a partir de su cargo. Son interpretaciones mías de qué mirarían, no opiniones suyas ni citas.

## Brais Moure — Ingeniero de Software y Fullstack (el generalista pragmático)
- **Complejidad que no se paga:** 318k líneas, 94 monolitos, 45 dependencias, 3 configs de build, 4 copias de skills. Mucha superficie para el tamaño del equipo (una persona + IA). Recortar antes que añadir.
- **Lo básico primero:** `minify:false`, `/chat` sin limitador, `err.message` en 5xx. Son arreglos de una tarde que dan más que cualquier refactor grande.
- **Datos:** `data.json` como base de datos real es el tipo de atajo que funciona hasta el primer segundo servidor. Tiene ADR (0007), pero el ADR no cubre la concurrencia.

## Carlos Azaustre — Ingeniero de Software (JavaScript/TypeScript y buenas prácticas)
- **TypeScript sin `strict`:** 963 errores, ~85% `strictNullChecks`. Se puede subir por carpetas con un `tsconfig.strict.json` y ratchet.
- **Claridad del código:** funciones y ficheros enormes; 1397 `console.*`; 118 `eslint-disable`/`ts-ignore`; 127 ficheros con `any`.
- **Tests:** ~55-65% prueban comportamiento, ~9% leen el código como texto (src/audit). Convertir esos a render real.
- **Documentación:** buen punto de partida (43 ADR, OpenAPI generado), pero hay duplicación (SDD, AGENTS, BACKLOG, plan_anti_fraude con nombre engañoso).

## Aris Guimerá — Mobile Tech Lead
- **Contexto real de uso:** sala de ensayo y directo, a menudo sin cobertura. El `sw.js` admite que no cachea nada útil y `/api/` nunca se cachea: el setlist y las letras no están sin red. Prioridad máxima para el Atril: IndexedDB + precache.
- **Ciclo de vida en móvil:** la recarga automática en `controllerchange` puede interrumpir un Atril o un ensayo; no hay `vite:preloadError`.
- **Navegación:** sin URLs por vista, el botón Atrás saca de la app; es lo primero que nota un usuario móvil.
- **Base correcta:** `viewport-fit=cover`, `theme-color` claro/oscuro, manifest `standalone`. Solo 15 componentes mencionan tamaños táctiles de 44 px (**S**: la cifra es heurística; auditar áreas táctiles en el Atril).
- **Wake lock:** solo en un sitio; extenderlo a cualquier modo escenario.

## Alan Buscaglia — Lead Front-End Architect
- **Contexto monolítico:** ~190 campos en `useAppController`, 40+ props por vista, 1 `memo`. Dividir por dominio con selectores; medir con el Profiler antes.
- **Fronteras de módulo:** hay 43 ADR de modularización (Atril, repertorio, reels…), buena señal; 94 monolitos siguen congelados. Terminar la migración por feature, con límites explícitos.
- **Enrutado sin router:** la vista activa es `useState` + `localStorage`. Sincronizar con `history` (~40 líneas) o adoptar un router, y entonces habilitar `lazy` por ruta de forma uniforme (`safeLazy` solo cubre las vistas).
- **Rendimiento:** build sin minificar, sin virtualización de listas grandes, `PublicEPK` (la página más pública) de 1.340 líneas.
- **Accesibilidad:** 135 modales y solo 8 con `role="dialog"`; un único `<Modal>`.

## Martín Cristóbal — CTO
- **Riesgo de continuidad:** el historial tiene 1.609 commits de «Claude» y 380 de una persona. Es una forma de trabajo válida, pero concentra el conocimiento y exige que las decisiones queden escritas (ADR, AGENTS.md) y que haya revisión humana real.
- **Revisabilidad:** el PR #235 tocó 1.330 ficheros y 36k líneas añadidas: ninguna revisión humana lo cubre. Partir los cambios.
- **Coste e infraestructura:** previews de Railway por PR generan gasto; el ledger de IA en producción tenía 0 filas (según el ADR 0006), así que el coste por banda no se mide aún. Sin eso no hay modelo de precios defendible.
- **Escalabilidad:** `data.json`, rate limiter en memoria y planificadores en proceso exigen réplicas=1. Documentar el límite o quitarlo.
- **Estrategia:** AGPL + licencia comercial (ADR 0009) es una decisión de negocio que conviene revisar con asesoría legal antes de cobrar.

## Nerea Luis — Doctora en IA
- **Evaluación real:** existe un eval serio de acordes (`scripts/evaluar-acordes.ts` mide acierto contra las correcciones de la banda), pero el resto de la IA (clasificación de respuestas del Lector, extracción de venues, chat) no tiene golden set ni métricas. 51 tests mockean la IA: miden código, no el modelo.
- **Medir antes de afirmar:** el detector de acordes y el scoring de pitches necesitan métricas con intervalos y casos difíciles (música real en directo), no solo medias.
- **Datos y sesgos:** el Lector aprende de las correcciones de la banda (`pitchLearning`); definir qué se guarda, durante cuánto y cómo se evita reforzar errores.
- **Honestidad del sistema:** los fallbacks locales devuelven JSON falso con `success:true` y `confidence:0.95` (sospecha de uso). Un sistema de IA debe fallar de forma visible.

## Xavi Portilla — Ingeniero de Plataforma de IA Generativa
- **Capa de acceso a modelos:** hay una (`generateContentWithFallback`), pero sin `bandId` obligatorio (10 de 67 llamadas lo pasan), sin `maxOutputTokens`, sin salida estructurada uniforme (1 `responseSchema` de 28 `responseMimeType`, ~66 `JSON.parse`).
- **Prompts como código:** inline en rutas, sin versión; falta una constante de versión guardada en `agent_execution_logs` para atribuir regresiones.
- **Trazabilidad:** sin traza estructurada por llamada (ruta, modelo, tokens, ms, fallback). Un esquema tipo flujo con trazas y evals (como el que ofrece Genkit) sería natural aquí; hoy solo hay `@google/genai`.
- **Fallback:** DeepSeek recibe texto plano, sin modo JSON y con 1500 tokens; descarta partes multimodales y tools.
- **Modelos:** lista con modelos 1.5 y un `gemini-3.8-flash` hardcodeado fuera del fallback (**S**: comprobar el catálogo vigente).

## Daniela Maissi — Security Engineer
- **Bien hecho:** `getTargetBandId` consistente (barrido sin huecos explotables), RLS en las 46 tablas del esquema, CodeQL activo, comparación en tiempo constante en las firmas HMAC.
- **Sesión:** cookie `httpOnly:false` por diseño documentado; sesión de 30 días en el estado JSON; **S**: sin revocación al cambiar la contraseña. Plan: sesión solo por cookie + hash del token.
- **Entradas:** sin validación (asignación masiva en `bands.ts`), 5xx que exponen `err.message`.
- **Cadena de suministro:** sin `npm audit` ni gitleaks en CI; tres builds de Railway; instalación sin `npm ci`.
- **Privacidad / RGPD:** hay política de privacidad solo en el flujo de fans; el respaldo a DeepSeek envía datos de bandas y leads a un tercero, y el ADR lo documenta pero no hay mención en los términos públicos. No encontré una ruta de borrado de cuenta ni de exportación de datos (**S**, grep acotado; verificar). Es lo primero a cerrar antes de captar clientes en la UE.
- **Logs:** 49 `console.*` con email/token/secret; el reseteo de contraseña imprime el email.
- **Rate limiting:** en memoria, sin `trust proxy`; con varias réplicas el cupo se multiplica.

## Francisco Palomares — VP of Engineering
- **Cadencia y estabilidad:** 238 commits en una sola semana (W41) frente a 10 en la actual: mucha actividad en ráfagas. Medir DORA (frecuencia de despliegue, lead time, tasa de fallos, MTTR) en vez de contar commits.
- **Calidad como proceso:** CI en un único job secuencial, E2E con `continue-on-error` sin flujos de dinero, cobertura global del 22% sin suelo por módulo crítico, 15% de commits fuera de Conventional Commits.
- **Deuda gestionada:** buena práctica: ratchet de ESLint (0), guardarraíl de 600 líneas, 43 ADR. Falta que la deuda tenga dueño y fecha (los 94 monolitos y los 963 errores de `strict`).
- **Estabilidad del CI:** el test intermitente de `googleTranslate.ts` rompe confianza en el semáforo; arreglarlo es de las primeras tareas.
- **Operación:** `/api/health` no comprueba la BD, sin `/ready`, sin política de backups verificada, alertas de Sentry sin versionar, sourcemaps desactivados.

---

## Prioridad conjunta (lo que coincide entre perfiles)

| Prioridad | Cambio | Perfiles que lo piden |
|---|---|---|
| 1 | `iaRateLimiter` + tope de historial + `maxOutputTokens` en `/chat`, y `bandId` obligatorio con cuota por banda | Brais, Martín, Xavi, Daniela |
| 2 | Quitar `err.message` de los 5xx y validar entradas con zod (bands, agent, billing) | Brais, Carlos, Daniela, Kiko |
| 3 | Atril robusto en directo: offline (IndexedDB), no recargar durante ensayo, URLs por vista | Aris, Alan, Brais |
| 4 | `minify` + sourcemaps ocultos a Sentry | Brais, Alan, Kiko |
| 5 | Estado fuera de `data.json` (o réplicas=1 documentado) y planificadores persistentes | Martín, Brais, Kiko |
| 6 | Privacidad/RGPD: borrado y exportación de datos, términos que mencionen proveedores de IA | Daniela, Martín |
| 7 | Evals de IA con golden set y traza estructurada por llamada | Nerea, Xavi |
| 8 | CI: arreglar el test flaky, `npm audit` + gitleaks, E2E de checkout bloqueante, umbrales por módulo | Kiko, Carlos, Daniela |
| 9 | `strict` por fases y fin de los tests que leen código como texto | Carlos |
| 10 | PR más pequeños y revisables | Martín, Kiko |
