# Matriz de aplicación del Máster al proyecto

Qué pide cada módulo del [Máster en Desarrollo con IA](./TEMARIO_BIG_SCHOOL.md), en qué punto está BandManager.io y **si tiene sentido aplicarlo aquí**.

> Principio: el máster enseña muchas prácticas; este proyecto solo adopta las que resuelven un problema real y medido, con un coste proporcionado a su tamaño. Aplicar una práctica porque «se aprendió» y no porque haga falta es justo el espagueti que queremos evitar (YAGNI). Ver el skill `ponytail`.

## Criterio de decisión

Una práctica se **aplica ahora** (🟢) si cumple las cuatro:
1. Resuelve un problema que **hemos medido o sufrido** en este repo (no uno hipotético).
2. Su coste es **proporcionado**: lo mantiene una persona con ayuda de IA y hay un único servicio desplegado.
3. **No añade** una dependencia, una capa o un servicio sin necesidad.
4. A ser posible, **la puede hacer cumplir la CI**, no la memoria de nadie.

Si falla alguna, se queda en **cuando duela** (🔵, con un disparador concreto que obliga a revisarla) o en **no aplicar** (⚪, con el motivo). Lo que no aplica al código aparece como ➖.

**Leyenda de estado en el repo:** ✅ ya aplicado · 🟡 parcial · ❌ no aplicado · ➖ no aplica al código.
**Estado del módulo** = el que figura en el índice del máster (Completada / Incompleta / Pendiente).

**Límites de lo que dice**
- Está hecha a partir de los **títulos** de módulos y lecciones, no de su contenido. Donde interpreto lo que una clase enseña, es una suposición mía; la columna «Apuntes» queda para que anotes lo que realmente se vio.
- «Evidencia» cita ficheros y números medidos en el repositorio. Lo marcado *(sin verificar)* no lo he comprobado.
- Las acciones remiten a fases de [`docs/plan/PLAN_MEJORA.md`](../plan/PLAN_MEJORA.md) y al análisis en [`docs/plan/ANALISIS.md`](../plan/ANALISIS.md).

---

## 1. Fundamentos del desarrollo de software

| Módulo | Máster | Repo | Evidencia | Decisión | Apuntes |
|---|---|:-:|---|---|---|
| Mentalidad y metodología de estudio; IA en el aprendizaje | Completada | ➖ | Hábito personal. | — | |
| Documentación y gestión del conocimiento | Completada | ✅ | `docs/adr/` (43 ADR), `docs/ARCHITECTURE.md`, `AGENTS.md`, OpenAPI en `docs/api/` | 🟢 Mantener. | |
| IA en el proceso de desarrollo (filosofía de uso, uso responsable) | Completada | 🟡 | ~1.600 commits de «Claude» frente a ~380 humanos; el PR #235 tocó 1.330 ficheros | 🟢 PR de ~400 líneas para que la revisión humana sea real (Fase 0.6). | |
| Ecosistema (terminal, Git/GitHub, IDE) | Incompleta | ✅ | Git, Actions, Husky (`commit-msg`, `pre-commit`, `pre-push`) | — | |
| Fundamentos de programación: errores y excepciones | Incompleta | 🟡 | 26 `.catch(() => null)` que tragan errores; 5xx que devuelven `err.message` | 🟢 `ErrorHttp` + handler global (Fases 1.2 y 2.1). | |
| Sistemas y redes: APIs, comunicación, datos | Incompleta | 🟡 | 357 operaciones HTTP bajo `/api`, OpenAPI por AST; paginación casi ausente; idempotencia solo en el webhook de Stripe y en memoria | 🟢 Paginación en los listados grandes e `Idempotency-Key` en los POST que cobran o envían correo. ⚪ Versionar la API (`/api/v1`): solo la consume tu propio frontend; reabrir si hay clientes externos. | |
| Lenguajes: OOP, funcional, asincronía, dependencias, modularidad | Incompleta | 🟡 | 94 ficheros >600 líneas congelados; Dependabot activo, sin `npm audit` | 🟢 Modularidad vía guardarraíles (Fase 0) y `npm audit` (0.7). ⚪ Reescribir en OOP o funcional puro: no aporta. | |
| Buenas prácticas: estilo, depuración y logging, testing, deuda, ética | Incompleta | 🟡 | ESLint en 0. 1.397 `console.*` sin logger; cobertura global ~25 % | 🟢 Logger con redacción de PII (Fase 2). Ética/IA responsable: ver §4. | |

## 2. Ingeniería de software

| Módulo | Máster | Repo | Evidencia | Decisión | Apuntes |
|---|---|:-:|---|---|---|
| Ciclo de vida del desarrollo | Completada | ✅ | `release-please-config.json`, `CHANGELOG.md`, CI de tres workflows, commitlint | — | |
| Análisis de requisitos: tipologías, UML, validación | Completada | 🟡 | `SDD.md` (241 líneas), `BACKLOG.md`. No he verificado si hay diagramas UML *(sin verificar)* | 🟢 Solo 2–3 diagramas de los flujos críticos (login, pitch, pago) en `docs/ARCHITECTURE.md`. ⚪ Documentación UML completa. | |
| Spec Driven Development | Completada | 🟡 | `SDD.md` y skills; no hay spec por cambio | 🟢 Versión ligera: una spec corta solo para **funcionalidad nueva** que cambie comportamiento. ⚪ Para refactors y arreglos de seguridad: el PR y el ADR ya bastan. | |
| Paradigmas de programación | Completada | ✅ | TypeScript multiparadigma; utilidades puras testeables | — | |
| Principios de diseño: SOLID, DRY/KISS/YAGNI, patrones, antipatrones | Incompleta | 🟡 | Ficheros dios (`leads/enrichment.ts` 1.700, `concert_to_album.ts` 1.585), 9 ciclos, `db` importa `services` | 🟢 SRP y dependencias en un solo sentido, hechas cumplir por guardarraíles (Fase 0.1–0.3). ⚪ Aplicar patrones de diseño «porque existen»: solo si el código los pide. | |

## 3. Arquitectura de software

| Módulo | Máster | Repo | Evidencia | Decisión | Apuntes |
|---|---|:-:|---|---|---|
| Introducción a la arquitectura: decisiones y estilos | Incompleta | 🟡 | ADR 0002 (monolito Express + SPA), 0006 (IA multi-proveedor), 0007 (scheduler en proceso) | 🟢 Un ADR corto por cada decisión estructural nueva. | |
| Clean Architecture con TypeScript (dominio, casos de uso, puertos y adaptadores) | Incompleta | ❌ | Rutas con lógica; `server/db` importa servicios | 🟢 **Versión ligera**: ruta fina → servicio → db, con dependencias en un solo sentido (Fase 2.4). 🔵 Puertos y adaptadores solo donde ya existen **dos implementaciones reales** (proveedores de IA, almacenamiento). ⚪ Entidades, value objects y casos de uso formales: sobre-ingeniería con un solo cliente (la SPA). Reabrir si aparece una segunda interfaz (app móvil nativa) o un segundo desarrollador. | |
| Arquitecturas distribuidas: microservicios, EDA, outbox | Incompleta | 🟡 | Cola de agentes con `locked_until` y recuperación de huérfanos (`agentQueueService.ts`) | ⚪ Microservicios, outbox y EDA formal: un servicio, una persona. 🔵 Eventos internos en proceso solo si hacen falta para romper un ciclo. Reabrir si el servicio necesita escalar por partes. | |

## 4. Fundamentos de la IA

| Módulo | Máster | Repo | Evidencia | Decisión | Apuntes |
|---|---|:-:|---|---|---|
| Introducción a la IA; IA generativa; LLMs | Completada | ➖ | Conocimiento de base | — | |
| Prompting y multimodalidad | Completada | 🟡 | Audio y visión con Gemini; prompts inline y sin versión; `sanitizeExternalText` solo en 7 ficheros | 🟢 Prompts con constante de versión y sanear texto externo (Fase 6.2). | |
| AI Frameworks: RAG, fine-tuning, LangChain | Completada | 🟡 | `pitchVectorStore.ts` + migración `pgvector` | ⚪ LangChain y fine-tuning: no hay problema que resuelvan. Un ADR de una línea con el motivo. | |
| Estado del arte: modelos razonadores, agentes | Completada | ✅ | Agentes Scout, Redactor, Enviador, Lector con aprobación humana (ADR 0005) | — | |
| IA responsable: privacidad, regulación | Completada | 🟡 | El respaldo a DeepSeek envía datos de bandas y leads a un tercero (ADR 0006); no veo mención en los términos públicos ni rutas de borrado o exportación de cuenta *(sin verificar a fondo)* | 🟢 Obligación legal si hay usuarios en la UE (Fase 6.1). | |

## 5. Herramientas

| Módulo | Máster | Repo | Evidencia | Decisión | Apuntes |
|---|---|:-:|---|---|---|
| IDEs, Warp, Codex, modelos locales, OpenClaw, n8n, diseño asistido, MVP con IA | Mixto | ➖ | Preferencias de entorno o fuera del producto | — | |
| IAs desde CLI (Claude Code, Gemini CLI, Copilot CLI) | Incompleta | ✅ | `CLAUDE.md` y `AGENTS.md`; skills en `.claude/skills/` | — | |
| Copilot en GitHub: Code Scanning + Dependabot | Completada | ✅ | CodeQL (PR #240: de 238 alertas a 0 nuevas); `dependabot.yml` | 🟢 Vaciar los 11 PR de Dependabot abiertos. | |
| Copilot en GitHub: resúmenes de PR y code review | Completada | 🟡 | Plantilla de PR existente | ⚪ No añadir otra revisión automática encima de CodeQL y la revisión humana. | |
| Revisión de código con IA (CodeRabbit) | Completada | ❌ | Sin `.coderabbit.yaml` | ⚪ Duplicaría CodeQL y la revisión; coste mensual. 🔵 Reabrir si el volumen de PR supera lo que se puede revisar. | |

## 6. Flujo de desarrollo con IA

| Módulo | Máster | Repo | Evidencia | Decisión | Apuntes |
|---|---|:-:|---|---|---|
| La IA como parte del stack; Modo Plan vs Build; prompt engineering | Completada | ✅ | `AGENTS.md`, plan por fases, skill `prompt-craft-and-dna` | — | |
| Reglas, bases de conocimiento, AGENTS.md, skills, subagentes, MCP | Completada | 🟡 | `AGENTS.md` y skills ✅. `skills/` existe en 4 copias (`skills/`, `.claude`, `.gemini`, `.opencode`), pero `sync-skills --check` en `verify:docs` garantiza que son idénticas: es una decisión consciente para varias herramientas. Los MCP que se usan no están documentados | 🟢 Una página con los MCP que se usan y para qué. ⚪ Reducir las 4 copias: el coste es solo tamaño del repo y ya hay chequeo; reabrir si la sincronía da problemas. ⚪ Carpeta `context/`: `AGENTS.md` ya cumple ese papel (y el repo ya sufrió documentación duplicada). | |
| Integración de APIs de IA (OpenAI, ElevenLabs, Vercel AI SDK) | Completada | 🟡 | Solo `@google/genai` y DeepSeek con capa propia (`generateContentWithFallback`) | ⚪ Migrar al Vercel AI SDK: la capa propia funciona. 🟢 Corregir su fallback (Fase 2.8). ADR de una línea con el motivo. | |

## 7. Calidad

| Módulo | Máster | Repo | Evidencia | Decisión | Apuntes |
|---|---|:-:|---|---|---|
| Testing: setup, TDD con IA, integración front, E2E | Completada | 🟡 | 377 ficheros de test; 8 specs de Playwright que **no bloquean** (`continue-on-error`) y ninguno cubre pago, pitch o Atril en directo | 🟢 Un E2E bloqueante de checkout y suelo de cobertura en los módulos críticos (Fases 0.9 y 5). | |
| Code smells, refactor y deuda | Completada | 🟡 | Ratchets (ESLint 0, límite de 600 líneas); 94 monolitos sin dueño ni fecha | 🟢 Dueño y fecha para los 5 peores. ⚪ Trocear los otros 89 «por trocear»: solo cuando se toquen por una funcionalidad. | |
| Métricas, coverage y complejidad; Quality Gate con Husky | Completada | 🟡 | Husky ✅. Cobertura 22/19/17/22 global; sin límites de complejidad | 🟢 Complejidad como ratchet (Fase 0.3). ⚪ Cobertura global del 100/80: el objetivo honesto es 80 % **en los módulos críticos**, no en toda la app. | |
| Observabilidad con Sentry | Completada | 🟡 | `@sentry/node` y `@sentry/react`; sourcemaps desactivados; `tracesSampleRate: 0` | 🟢 Sourcemaps ocultos y alerta de 5xx (Fase 1.3). | |
| Seguridad + ENV + OWASP Top 10 | Completada | 🟡 | Ver §9 | Ver §9 | |
| Documentación con IA: docs as code, ADR, API | Incompleta | ✅ | ADR 0011 (docs as code), 43 ADR, OpenAPI; el grafo versiona 1.556 `.md` | 🔵 Generar el grafo en CI cuando el ruido en los PR moleste. | |
| Usabilidad: heurísticas y a11y, formularios, microcopy | Pendiente | 🟡 | 135 ficheros con `fixed inset-0` y solo 8 con `role="dialog"`/`aria-modal`; sin plugin de a11y | 🟢 `<Modal>` único y `eslint-plugin-jsx-a11y` (Fases 0.8 y 4). ⚪ Programa de microcopy con IA: sin problema medido. | |

## 8. Infraestructura y cloud

| Módulo | Máster | Repo | Evidencia | Decisión | Apuntes |
|---|---|:-:|---|---|---|
| DevOps y CI/CD | Completada | ✅ | `ci.yml`, `docs.yml`, `release-please.yml`; ADR 0013 | 🔵 CI en jobs paralelos cuando el tiempo de CI (~10 min) estorbe. | |
| Cloud computing: proveedores, IaC, costes | Completada | 🟡 | Railway + Supabase; los entornos de PR de Railway generan coste | 🟢 Desactivar o limitar los previews (Fase 1.5). ⚪ Infraestructura como código: hay un servicio. | |
| Bases de datos: relacionales, no relacionales, vectoriales | Completada | 🟡 | Postgres con RLS; `pgvector` para pitches; el estado de negocio vive en `data.json` | 🟢 Sacar el estado de `data.json` por dominio (Fase 3), a tu ritmo. | |
| Contenerización (Docker, Kubernetes) | Completada | ❌ | Sin `Dockerfile`; tres configuraciones de build (`railway.json`, `nixpacks.toml`, `railpack.json`) | 🟢 Dejar **un** build claro y `npm ci` (Fase 1.7). ⚪ Docker y Kubernetes: Railway ya construye y despliega; reabrir si cambias de plataforma. | |
| LangChain con Python, Gradio | Completada | ➖ | Fuera del stack | — | |
| LLMOps: observabilidad y evaluations | Completada | 🟡 | `ai_token_ledger` y `agent_execution_logs`; eval solo de acordes (`npm run eval:acordes`) | 🟢 Traza por llamada y un golden set **pequeño** (30–50 casos) (Fase 6.2–6.3). ⚪ LangSmith u otra plataforma externa. | |
| Multi-Agents (Google ADK) | Completada | 🟡 | Agentes propios sin framework | ⚪ Migrar a ADK: no hay problema que resuelva. | |

## 9. Seguridad

| Módulo | Máster | Repo | Evidencia | Decisión | Apuntes |
|---|---|:-:|---|---|---|
| Desarrollo seguro: Security by Design, amenazas, OWASP | Completada | 🟡 | `AGENTS.md` §2 (multi-tenancy, trust boundary); skills de seguridad | 🔵 Una página de modelo de amenazas cuando se abra a más usuarios. | |
| SSDLC, DevSecOps, Shift Left, Snyk | Completada | 🟡 | CodeQL ✅; sin `npm audit` ni escaneo de secretos | 🟢 `npm audit` y gitleaks en CI (Fase 0.7). ⚪ Snyk: con CodeQL, Dependabot y `npm audit` está cubierto. | |
| Codificación segura: validación, authN/authZ, APIs | Completada | 🟡 | `getTargetBandId` consistente (barrido sin huecos explotables). Sin validación de entradas: `bands.ts` guarda `{...req.body, id}` | 🟢 zod + `validar(schema)` empezando por `bands`, `agent` y `billing` (Fase 2.2). | |
| Uso de la IA en el desarrollo seguro | Completada | ✅ | Skills de seguridad; PR #240 corrige inyección en el prompt del chat | 🟢 Limitador de IA en `/chat` (Fase 1.1). | |

**OWASP Top 10 frente al repositorio**

| # | Riesgo | Repo | Evidencia | Decisión |
|---|---|:-:|---|---|
| A01 | Broken Access Control | ✅ | `bandAccess.ts` (`getTargetBandId`), test `bandIdTrustBoundary`, RLS | 🟢 Confirmar las rutas fuera del helper |
| A02 | Cryptographic Failures | 🟡 | HMAC en tiempo constante; sesión de 30 días en el JSON de estado | 🟢 Hash del token de sesión (Fase 3) |
| A03 | Injection | 🟡 | PR #240: rutas de fichero confinadas, prompt del chat saneado | 🟢 Zod en entradas (Fase 2.2) |
| A04 | Insecure Design | 🟡 | Aprobación humana de agentes (ADR 0005), rate limiting | 🟢 Cuota de IA por banda (Fase 2.5) |
| A05 | Security Misconfiguration | 🟡 | CSP mínima; sin `trust proxy`; tres builds | 🟢 Fase 1.7 |
| A06 | Vulnerable and Outdated Components | 🟡 | Dependabot; 11 PR abiertos; sin `npm audit` | 🟢 Fase 0.7 |
| A07 | Identification and Authentication Failures | 🟡 | Cookie `httpOnly:false` por diseño documentado; sin revocación al cambiar contraseña *(sospecha)* | 🔵 Cookie `httpOnly` cuando se migre el cliente (Fase 6.5) |
| A08 | Software and Data Integrity Failures | 🟡 | Webhooks de Stripe firmados; `npm ci` en CI pero no en el build de Railway | 🟢 Fase 1.7 |
| A09 | Logging and Monitoring Failures | 🟡 | Sentry; PII en logs (email del reseteo de contraseña) | 🟢 Logger con redacción |
| A10 | SSRF | ✅ | `ssrfGuard.ts`; los scrapers de leads usan `fetchUrlExternaSegura` (PR #240) | — |

## 10. Desarrollo potenciado por IA (proyectos) y bloques optativos

| Módulo | Máster | Repo | Nota | Decisión |
|---|---|:-:|---|---|
| Proyectos front, IA, backend y mobile; práctica de desarrollo moderno con IA | Incompleta | ➖ | Son prácticas del máster. Sus lecciones sobre Engram, Skills y SDD encajan con `AGENTS.md`, `skills/` y `SDD.md` | — |
| Primeros pasos del TFM | Incompleta | ➖ | Si BandManager.io es el TFM, esta matriz sirve de evidencia de aplicación crítica de cada módulo | — |
| Masterclass: DDD, evaluar LLMs, Docker con IA, GitHub + agentes | Incompleta | 🟡 | **DDD**: ⚪ (formal es excesivo, ver §3). **Evaluar LLMs**: 🟢 útil para el golden set (Fase 6.2). **Docker**: ⚪ (ver §8). **GitHub + agentes**: ya cubierto | según fila |
| Productividad, soft skills, emprendimiento, inglés, comunicación | Incompleta | ➖ | No aplican al código | — |

---

## Resumen

**Se aplica ahora (🟢):** PR pequeños; errores y respuestas seguras; validación con zod; logger con redacción; limitador y tope en `/chat`; guardarraíles de ciclos, complejidad y capas; `npm audit` y gitleaks; E2E de checkout bloqueante; Sentry con sourcemaps; `minify`; un solo build; estado fuera de `data.json`; `<Modal>` y a11y; RGPD; traza de IA y golden set pequeño.

**Cuando duela (🔵):** CI paralelo, grafo fuera del repo, puertos y adaptadores, modelo de amenazas, cookie `httpOnly`, eventos internos.

**No se aplica (⚪), con motivo:** microservicios, outbox, Kubernetes, Docker, IaC, LangChain, ADK, Vercel AI SDK, CodeRabbit, Snyk, DDD formal, entidades y casos de uso formales, versionado de API, programa de microcopy, trocear todos los monolitos por trocear, cobertura del 100/80 global, reducir las 4 copias de skills.

## Orden de estudio sugerido

Solo para los módulos que sí alimentan una decisión 🟢:

| Antes de… | Conviene ver… |
|---|---|
| Fase 2.4 (ruta fina → servicio → db) | *Clean Architecture con TypeScript* (la parte de estructura y dependencias, no la de dominio formal) y *Antipatrones* |
| Fase 4 y 0.8 (a11y, modales) | *Usabilidad: heurísticas y a11y* |
| Fase 6 (evals, RGPD) | *¿Cómo evaluar LLMs?* (Masterclass) y los directos de Seguridad |

## Cómo mantener esta matriz

1. Al cerrar una fase, cambia el estado de las filas afectadas y la fecha al pie.
2. Cada 🔵 tiene un disparador escrito: cuando ocurra, pasa a 🟢 con un ADR corto.
3. Cada ⚪ se reabre solo si cambia la situación (otro cliente, otro equipo, otra plataforma), no por haberlo estudiado.
4. Si el máster actualiza el temario, sustituye `TEMARIO_BIG_SCHOOL.md` y revisa solo las filas nuevas.

*Última revisión: 2026-10-13. Estado de las filas tomado del repositorio en `main` tras el PR #240.*
