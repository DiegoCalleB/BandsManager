# Plan de mejora de BandManager.io

Objetivo: resolver los hallazgos del análisis (`ANALISIS.md`) **sin añadir código espagueti**.

Una advertencia honesta: ningún plan garantiza «100 %» por buena voluntad. Lo que sí se puede hacer es que la regla la haga cumplir la máquina. Por eso la **Fase 0 instala los guardarraíles antes de tocar nada**: cada uno es un *ratchet* (el valor actual queda congelado y solo puede mejorar). Así lo nuevo no puede empeorar aunque se escriba deprisa o con IA.

---

## 1. Principios de trabajo (valen para todas las fases)

1. **Un PR = una idea.** Máximo ~400 líneas netas de código (sin regenerados). Si crece, se parte. El #235 tocó 1.330 ficheros: eso no se puede revisar.
2. **No se mezcla refactor con comportamiento.** Primero se mueve el código sin cambiar lo que hace (con tests verdes antes y después); luego, en otro PR, se cambia el comportamiento.
3. **Test antes de mover.** Si la zona no tiene tests de comportamiento, se escribe uno que fije lo que hace hoy (caracterización) y recién entonces se trocea.
4. **Estrangulamiento, no reescritura.** Para lo grande (estado en `data.json`, contexto monolítico), se crea la pieza nueva al lado, se migra de a una ruta o vista, y solo al final se borra la vieja.
5. **Cada decisión estructural lleva un ADR** corto en `docs/adr/` (ya hay 43). Si no se puede explicar en un ADR, es demasiado grande.
6. **Los ratchets solo bajan.** Ningún PR sube un baseline; si uno falla, se arregla el código, no el umbral.
7. **Cada monolito tiene dueño y fecha.** Congelar no es lo mismo que resolver.
8. **Reversible siempre.** Cada PR dice cómo se revierte (un `git revert` basta o hace falta migración inversa).

## 2. Línea base actual (medida; se actualiza al cerrar cada fase)

| Métrica | Hoy | Meta |
|---|---:|---:|
| Ficheros >600 líneas congelados | 94 | 0 (a largo plazo) |
| Dependencias circulares en `server/` | 9 | 0 |
| Errores de `tsc --strict` | 963 | 0 |
| Cobertura global | ~25 % | 40 % global y suelo por módulo crítico |
| Ficheros con `any` | 127 | baja, sin subir |
| `console.*` en código | 1.397 | logger estructurado |
| Rutas que leen `req.body/query` sin validar | sin medir (253 usos) | 0 |
| 5xx con `err.message` | 48–147 (según patrón) | 0 |
| Llamadas de IA que pasan `bandId` | 10 de 67 | 67 de 67 |
| E2E bloqueantes | 0 (`continue-on-error`) | flujos críticos |

---

## Fase 0 — Guardarraíles anti-espagueti (antes de todo; 2–3 PR pequeños)

Es la fase que evita el espagueti. Todo lo que sigue se apoya en ella.

| # | Guardarraíl | Cómo | Evita |
|---|---|---|---|
| 0.1 | **Ciclos de imports** | `madge --circular` en CI con baseline de 9; solo puede bajar | Que `db` importe servicios, y ciclos nuevos |
| 0.2 | **Fronteras de capas** | `eslint-plugin-boundaries` (o `no-restricted-imports` por carpeta): `routes → services → db`; `db` no importa `services`; `src/` no importa `server/` | Saltarse capas |
| 0.3 | **Complejidad y tamaño de función** | ESLint `complexity`, `max-lines-per-function`, `max-depth`, `max-params` en modo ratchet (baseline = lo actual) | Funciones kilométricas nuevas |
| 0.4 | **Sin `err.message` en respuestas** | `no-restricted-syntax` sobre `res.*json({... err.message})` | Fuga de errores internos |
| 0.5 | **`any` y `ts-ignore` no suben** | Contador en CI con baseline | Deuda de tipos |
| 0.6 | **Tamaño de PR** | Script de CI que avisa/falla si un PR supera ~800 líneas de código netas salvo etiqueta `refactor-mecanico` | PR ilegibles |
| 0.7 | **Cadena de suministro** | `npm audit --omit=dev --audit-level=high` + gitleaks en CI | Dependencias y secretos |
| 0.8 | **`jsx-a11y` y reglas de hooks** | `eslint-plugin-jsx-a11y` en ratchet | Accesibilidad |
| 0.9 | **Bloquear E2E crítico** | Quitar `continue-on-error` cuando haya al menos 1 spec de flujo de dinero | Falsa sensación de seguridad |

**Hecho cuando:** CI falla si se añade un ciclo, se salta una capa, se añade una función muy compleja o se filtra `err.message`; ningún baseline sube.

---

## Fase 1 — Riesgo y coste inmediatos (1 semana; PR pequeños)

| # | Cambio | Detalle | Hallazgo |
|---|---|---|---|
| 1.1 | `/chat` protegido | `iaRateLimiter`, tope de turnos y de caracteres del historial, `maxOutputTokens` por caso de uso (por defecto en `generateContentWithFallback`) | IA #1 |
| 1.2 | Errores seguros | Clase `ErrorHttp(status, codigo, mensaje)` + handler global con mensaje genérico e id de correlación; migrar los 5xx que exponen `err.message` | Backend #3 |
| 1.3 | Build rápido | `minify: 'esbuild'`, sourcemaps `hidden` subidos a Sentry; medir tamaño antes y después | Front #1 |
| 1.4 | CI estable | Limpiar los temporizadores de `googleTranslate.ts` (y fake timers en su test) | Calidad #4 |
| 1.5 | Gasto de Railway | Desactivar o limitar los entornos de PR; borrar los 14 actuales; decidir los 11 PR de Dependabot | Coste |
| 1.6 | Salud real | Endpoint `/ready` con ping a Supabase; healthcheck de Railway apuntando a él | DevOps #4 |
| 1.7 | Un solo build | Elegir entre `railway.json`, `nixpacks.toml` y `railpack.json`; `npm ci`; `builder` explícito | DevOps #3 |
| 1.8 | Gmail de Bakandeya | Confirmar que no hay eventos nuevos y cerrar `REACT-V` en Sentry | Operación |

**Hecho cuando:** `/chat` no puede disparar coste sin límite; ningún 5xx expone detalle interno; el build está minificado y Sentry muestra trazas legibles.

---

## Fase 2 — Cimientos del servidor (2–3 semanas)

Orden pensado para que cada paso reduzca el riesgo del siguiente.

1. **Contrato de respuesta** `{ error: { code, message } }` y helper `responder.ok/err` (ADR). Migrar por router.
2. **Validación con zod** + middleware `validar(schema)`. Empezar por `bands.ts` (asignación masiva), `agent.ts` y `billing.ts`. Los esquemas alimentan OpenAPI.
3. **Romper los 9 ciclos.** Primero `db → services` (colaLetras, sentimentAnalysis), invirtiendo la dependencia con eventos o callbacks.
4. **Ruta fina → servicio → db** en los 5 monolitos más dañinos: `leads/enrichment.ts`, `concert_to_album.ts`, `agent.ts`, `db/repertoire.ts`, `state.ts`. Un PR por servicio extraído, con test de caracterización.
5. **IA con coste atribuido:** `bandId` obligatorio en `generateContentWithFallback`; cuota mensual por banda con comprobación previa; ledger persistente (no solo buffer en memoria).
6. **Salida estructurada:** helper `generateJson<T>(schema)` con `responseSchema` + zod + un reintento; migrar `bands.ts`, `agent.ts`, `metrics.ts`.
7. **Planificadores fiables:** tabla `scheduler_runs` con `last_run_at` y advisory lock; ejecutar al arrancar si venció.
8. **Fallback de IA correcto:** DeepSeek con modo JSON, saltarlo si hay tools o multimodal, más tokens; documentar el flujo de datos.

**Hecho cuando:** ciclos = 0; las tres rutas más delicadas validan entradas; ninguna llamada de IA sin `bandId`.

---

## Fase 3 — Datos y estado (1–2 meses; es lo más delicado)

Estrangulamiento por dominio. Nunca «todo a la vez».

1. Inventario: qué dominios viven hoy en `data.json` (bands, users, sesiones, epk, autonomía…).
2. Por cada dominio: repositorio en `server/db/` → doble escritura → lectura desde Supabase → quitar la escritura al JSON.
3. **Sesiones** fuera del JSON: tabla con hash del token, expiración y revocación al cambiar la contraseña.
4. `data.json` queda solo para modo demo (`NODE_ENV`).
5. **Migraciones unificadas:** mover los `migration_*.sql` sueltos a `supabase/migrations/`, retirar o regenerar `supabase_schema.sql`, test que compare las columnas usadas con el esquema.
6. Decidir y documentar el límite mientras tanto: réplicas = 1.

**Hecho cuando:** ninguna ruta de negocio llama a `saveState`; un segundo despliegue no pisa datos.

---

## Fase 4 — Frontend (continuo, en paralelo a la 2 y 3)

1. `vite:preloadError` y no recargar en `controllerchange` durante Atril o ensayo; aviso «nueva versión».
2. **URLs por vista** con `history` (~40 líneas).
3. **Un único `<Modal>`** (`role`, `aria-modal`, foco, Esc) y migrar los 10 más usados.
4. **Contextos por dominio** con selectores; medir con el Profiler antes de dividir el contexto de ~190 campos.
5. **Atril sin conexión:** setlist y letras activos en IndexedDB, precache de assets, indicador «listo sin conexión».
6. Troceo por feature de los monolitos de `src/` (LoginModal, PublicEPK, ExcelImportModal, VenueMap), un ADR de modularización por cada uno, como ya hacéis.
7. Barrido de `visual-identity` por módulo (bordes, colores fuera de paleta).
8. `useWakeLock` en cualquier modo escenario.

**Hecho cuando:** el botón Atrás funciona, el Atril abre sin red, y los modales cumplen accesibilidad básica.

---

## Fase 5 — Calidad y proceso (continuo)

1. **`strict` por fases:** `tsconfig.strict.json` con carpetas ya limpias + ratchet; orden: `server/db` y `server/utils` → `server/services` → `server/routes` → `src/hooks` y `src/utils` → componentes por carpeta (963 errores, ~85 % de nulos).
2. **Cobertura por módulo crítico:** suelo para `billing`, `auth`, `bandAccess`, `agentEngine`, webhooks de Stripe.
3. **E2E de flujos de dinero y directo:** checkout, envío de pitch, Atril en directo; dejarlos bloqueantes.
4. **CI paralelo:** typecheck, unit con shards y E2E en jobs separados; caché de Playwright.
5. **Tests que leen código como texto** (`src/audit/*`, 35 ficheros) → render real.
6. **Higiene del repo:** una sola fuente de `skills/` (hoy 4 copias), grafo generado fuera del repo, mover `presentacion/` (22 MB) y los SQL de la raíz.
7. **Commits:** `header-max-length` como error.

---

## Fase 6 — Privacidad e IA responsable (antes de captar clientes en la UE)

1. **RGPD:** ruta de borrado de cuenta y de exportación de datos; política de privacidad completa; términos que mencionen a los proveedores de IA (Gemini, DeepSeek); retención de datos del Lector y del aprendizaje de pitches.
2. **Evaluación de IA:** golden set de 30–50 casos (clasificación de respuestas del Lector, extracción de venues, chat con id inventado), `npm run eval:llm` ejecutable antes de cambiar un prompt o un modelo; **prompts con versión** guardada en `agent_execution_logs`.
3. **Traza por llamada de IA:** ruta, modelo, tokens, latencia, `fallbackFrom`, sin el texto del prompt.
4. **Fallos visibles:** los fallbacks locales no devuelven `success: true` con confianza 0,95.
5. **Sesión `httpOnly`:** migrar el cliente a sesión solo por cookie.

---

## 3. Ritmo sugerido

| Semana | Foco |
|---|---|
| 1 | Fase 0 (0.1–0.5, 0.7) + Fase 1 |
| 2–3 | Fase 0 (resto) + Fase 2 (pasos 1–3) |
| 4–6 | Fase 2 (4–8) + inicio Fase 4 |
| 7–14 | Fase 3 en paralelo con Fase 4 y 5 |
| Antes de captar en UE | Fase 6 |

Cada viernes: actualizar la tabla de la sección 2 (un PR de una línea) para ver si los números bajan.

## 4. Decisiones que necesito de ti

1. **Fase 3:** ¿asumes el riesgo de sacar el estado de `data.json`, o prefieres dejarlo con réplicas = 1 documentado y atacarlo más tarde?
2. **Ritmo:** ¿cuántos PR por semana puedes revisar de verdad? (Define el tamaño real de cada fase.)
3. **i18n:** ¿traducción automática fuera de EPK/fans/músicos es una decisión de producto, o hay que internacionalizar de verdad?
4. **RGPD:** ¿hay ya clientes en la UE o es antes de lanzar?
5. **Sesiones:** ¿aceptas migrar el cliente a cookie `httpOnly` (cambia cómo se guarda el token)?
