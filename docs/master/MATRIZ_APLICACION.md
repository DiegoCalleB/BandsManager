# Matriz de aplicación del Máster al proyecto

Qué pide cada módulo del [Máster en Desarrollo con IA](./TEMARIO_BIG_SCHOOL.md) y en qué punto está BandManager.io.

**Cómo usarla**
- Una fila por módulo (o grupo de módulos muy próximos). Cada hueco apunta a una fase de [`docs/plan/PLAN_MEJORA.md`](../plan/PLAN_MEJORA.md); el análisis que lo justifica está en [`docs/plan/ANALISIS.md`](../plan/ANALISIS.md).
- Al abrir un PR que aplique un punto del máster, cítalo en la descripción (por ejemplo «Máster: Clean Architecture → puertos y adaptadores») y actualiza la fila aquí.
- Revisa la matriz al cerrar cada fase del plan.

**Límites de lo que dice**
- Está hecha a partir de los **títulos** de módulos y lecciones, no de su contenido. Donde interpreto lo que una clase enseña, es una suposición mía; la columna «Apuntes» queda para que anotes lo que realmente se vio.
- «Evidencia» cita ficheros y números medidos en el repositorio. Los marcados con *(sin verificar)* no los he comprobado.

**Leyenda:** ✅ aplicado · 🟡 parcial · ❌ sin aplicar · ➖ no aplica al código del repositorio.
**Estado del módulo** es el que figura en el índice del máster (Completada / Incompleta / Pendiente / Aprobado).

---

## 1. Fundamentos del desarrollo de software

| Módulo | Máster | Estado | Evidencia en el repo | Acción | Apuntes |
|---|---|:-:|---|---|---|
| Mentalidad y metodología de estudio; IA en el aprendizaje | Completada | ➖ | Es hábito personal, no código. | — | |
| Documentación y gestión del conocimiento | Completada | ✅ | `docs/adr/` (43 ADR), `docs/ARCHITECTURE.md`, `AGENTS.md`, OpenAPI generado en `docs/api/` | Mantener; ver «generar el grafo fuera del repo» (Fase 5) | |
| IA en el proceso de desarrollo (filosofía de uso, uso responsable) | Completada | 🟡 | `AGENTS.md` §7 fija reglas de uso para agentes. El historial tiene ~1.600 commits de «Claude» frente a ~380 humanos y PR enormes (#235: 1.330 ficheros) | Revisión humana real: PR ≤ ~400 líneas (Fase 0.6) | |
| Ecosistema (terminal, Git/GitHub, IDE) | Incompleta | ✅ | Git, GitHub Actions, Husky (`commit-msg`, `pre-commit`, `pre-push`) | — | |
| Fundamentos de programación: manejo de errores y excepciones | Incompleta | 🟡 | 26 `.catch(() => null)` que tragan errores; 5xx que devuelven `err.message` | `ErrorHttp` + handler global (Fase 1.2); contrato de errores (Fase 2.1) | |
| Sistemas y redes: APIs, comunicación, gestión de datos | Incompleta | 🟡 | 357 operaciones HTTP bajo `/api`, OpenAPI por AST; sin versionado, paginación casi ausente, idempotencia solo en el webhook de Stripe y en memoria | Paginación por cursor, `Idempotency-Key` (Fase 2) | |
| Lenguajes: OOP, funcional, asincronía, entornos y dependencias, modularidad | Incompleta | 🟡 | Funciones puras en `src/utils/` (p. ej. `calendarConflicts.ts`); 94 ficheros >600 líneas congelados; Dependabot activo pero sin `npm audit` | Modularidad: Fases 0.1–0.3 y 2.4; dependencias: Fase 0.7 | |
| Buenas prácticas: estilo, depuración y logging, testing, deuda, ética | Incompleta | 🟡 | ESLint ratchet en 0. 1.397 `console.*` sin logger; cobertura global ~25 % | Logger estructurado con redacción de PII (Fase 2); ética: Fase 6 | |

## 2. Ingeniería de software

| Módulo | Máster | Estado | Evidencia en el repo | Acción | Apuntes |
|---|---|:-:|---|---|---|
| Ciclo de vida del desarrollo | Completada | ✅ | `release-please-config.json`, `CHANGELOG.md`, CI de tres workflows, commitlint | — | |
| Análisis de requisitos (tipologías, métodos, UML, validación) | Completada | 🟡 | `SDD.md` (241 líneas), `BACKLOG.md`. No he verificado si hay diagramas UML *(sin verificar)* | Diagrama de casos de uso y de secuencia para los flujos críticos (login, pitch, pago) en `docs/ARCHITECTURE.md` | |
| Spec Driven Development | Completada | 🟡 | `SDD.md` existe y hay skills; no hay una spec por cambio ni plantilla de PR que la pida | Plantilla de spec corta por feature y casilla «spec enlazada» en el PR | |
| Paradigmas de programación | Completada | ✅ | TypeScript multiparadigma; utilidades puras testeables | — | |
| Buenas prácticas y principios de diseño: SOLID, DRY/KISS/YAGNI, patrones, antipatrones | Incompleta (antipatrones y cuestionarios pendientes) | 🟡 | Ficheros dios (`leads/enrichment.ts` 1.700 líneas, `concert_to_album.ts` 1.585), 9 dependencias circulares, capa `db` que importa `services`. Skills `clean-code-discipline` y `ponytail` ya definen la actitud | Guardarraíles estructurales (Fase 0.1–0.3) y troceo (Fase 2.4) | |

## 3. Arquitectura de software

| Módulo | Máster | Estado | Evidencia en el repo | Acción | Apuntes |
|---|---|:-:|---|---|---|
| Introducción a la arquitectura: decisiones, estilos, monolito modular, hexagonal, clean, EDA | Incompleta | 🟡 | Decisiones registradas (ADR 0002 monolito Express + SPA, 0006 IA multi-proveedor, 0007 scheduler en proceso). Monolito modular a medias | Un ADR por decisión estructural nueva (principio 5 del plan) | |
| Aplicando Clean Architecture con TypeScript (dominio, casos de uso, puertos y adaptadores, composición, testing) | Incompleta | ❌ | No hay capa de dominio ni de casos de uso: las rutas contienen lógica y `server/db` importa servicios | Empezar por **un** dominio (p. ej. facturación o enriquecimiento de leads): entidades + casos de uso + puerto/adaptador, y un test sin Express (Fase 2.4) | |
| Arquitecturas distribuidas: comunicación síncrona y asíncrona, EDA, outbox | Incompleta | 🟡 | Cola de agentes con `locked_until` y recuperación de trabajos huérfanos (`server/services/agentQueueService.ts`); sin patrón outbox | **No** pasar a microservicios (YAGNI). Aplicar solo la lección de eventos internos para romper los ciclos `db → services` (Fase 2.3) | |

## 4. Fundamentos de la IA

| Módulo | Máster | Estado | Evidencia en el repo | Acción | Apuntes |
|---|---|:-:|---|---|---|
| Introducción a la IA; IA generativa; LLMs y librerías | Completada | ➖ | Conocimiento de base | — | |
| Prompting y multimodalidad | Completada | 🟡 | Audio y visión con Gemini; prompts inline en rutas y sin versión; `sanitizeExternalText` solo en 7 ficheros | Prompts en módulos con constante de versión (Fase 6.2); sanear todo texto externo | |
| AI Frameworks: RAG, fine-tuning, LangChain | Completada | 🟡 | `server/services/pitchVectorStore.ts` y migración `pgvector`; sin LangChain (decisión propia, no un hueco) | Documentar en un ADR por qué no se usa un framework | |
| Estado del arte: modelos razonadores, agentes | Completada | ✅ | Agentes Scout, Redactor, Enviador y Lector con aprobación humana (ADR 0005) | — | |
| IA responsable (explicabilidad, privacidad, regulación) | Completada | 🟡 | El respaldo a DeepSeek envía datos de bandas y leads a un tercero (ADR 0006); no veo mención en los términos públicos ni rutas de borrado/exportación de cuenta *(sin verificar a fondo)* | RGPD y transparencia (Fase 6.1) | |

## 5. Herramientas

| Módulo | Máster | Estado | Evidencia en el repo | Acción | Apuntes |
|---|---|:-:|---|---|---|
| Filosofía de uso; IDEs (VS Code + Copilot, Cursor, JetBrains, Antigravity) | Completada | ➖ | Preferencia personal de entorno | — | |
| Copilot dentro de GitHub: PR summaries, code review | Completada | 🟡 | PR con plantilla (`.github/pull_request_template.md`) | Pedir resumen de PR y revisión como paso estándar | |
| Copilot dentro de GitHub: Code Scanning + Dependabot | Completada | ✅ | CodeQL activo (PR #240: de 238 alertas a 0 nuevas); `.github/dependabot.yml` | Decidir y vaciar los 11 PR de Dependabot abiertos | |
| IAs desde CLI (Claude Code, Gemini CLI, Copilot CLI) | Incompleta | ✅ | `CLAUDE.md` y `AGENTS.md` como punto de entrada; skills en `.claude/skills/` | — | |
| Revisión de código con IA (CodeRabbit) | Completada | ❌ | No hay `.coderabbit.yaml` | Opcional: probarlo en un PR; no es prioritario si ya hay CodeQL y revisión humana | |
| Warp, Codex, modelos locales, OpenClaw, n8n | Mixto | ➖ | No forman parte del producto | — | |
| MVP con IA, diseño visual asistido | Completada | ➖ | El producto ya pasó esa etapa | — | |

## 6. Flujo de desarrollo con IA

| Módulo | Máster | Estado | Evidencia en el repo | Acción | Apuntes |
|---|---|:-:|---|---|---|
| La IA como parte del stack; Modo Plan vs Build | Completada | ✅ | `AGENTS.md` y plan por fases como este | — | |
| Prompt engineering para developers | Completada | 🟡 | Skill `prompt-craft-and-dna` | — | |
| Reglas, bases de conocimiento y documentación: carpeta Context, AGENTS.md, skills, subagentes, MCP | Completada | 🟡 | `AGENTS.md` ✅ y skills ✅, pero `skills/` está en **4 copias** (589 ficheros) y no existe carpeta `context/`. Los MCP que se usan no están documentados en el repo | Una sola fuente de skills (Fase 5); documentar los MCP usados en `docs/referencia/` | |
| Integración de APIs de IA (OpenAI, ElevenLabs, Vercel AI SDK) | Completada | 🟡 | Solo `@google/genai` y DeepSeek con capa propia (`generateContentWithFallback`); sin Vercel AI SDK | ADR que compare la capa propia con el AI SDK; corregir el fallback (Fase 2.8) | |

## 7. Calidad

| Módulo | Máster | Estado | Evidencia en el repo | Acción | Apuntes |
|---|---|:-:|---|---|---|
| Testing: setup, TDD con IA, integración front, E2E | Completada | 🟡 | 377 ficheros de test, 8 specs de Playwright que **no bloquean** (`continue-on-error`) y ninguno de pago, pitch o Atril en directo | E2E bloqueante de checkout (Fase 0.9, 5) | |
| Code smells, refactor y deuda | Completada | 🟡 | Ratchets (ESLint 0, guardarraíl de 600 líneas); 94 monolitos sin dueño ni fecha | Dueño y fecha por monolito (principio 7) | |
| Métricas, coverage y complejidad; Quality Gate con Husky | Completada | 🟡 | Husky ✅. Cobertura 22/19/17/22 global; sin límites de complejidad | Complejidad en ESLint (Fase 0.3); suelo por módulo crítico (Fase 5) | |
| Observabilidad con Sentry | Completada | 🟡 | `@sentry/node` y `@sentry/react`; sourcemaps desactivados (`vite.config.ts`), `tracesSampleRate: 0` en el backend | Sourcemaps ocultos y alertas (Fase 1.3) | |
| Seguridad + ENV + OWASP Top 10 | Completada | 🟡 | Ver §9 | Ver §9 | |
| Documentación con IA: docs as code, ADR, API | Incompleta | ✅ | ADR 0011 (docs as code), 43 ADR, OpenAPI. El grafo de conocimiento versiona 1.556 `.md` | Generarlo en CI como artefacto (Fase 5) | |
| Usabilidad: heurísticas y a11y, formularios, microcopy, rapidez | Pendiente | 🟡 | 135 ficheros con `fixed inset-0` y solo 8 con `role="dialog"`/`aria-modal`; sin `eslint-plugin-jsx-a11y` | `<Modal>` único y plugin de a11y (Fases 0.8, 4) | |

## 8. Infraestructura y cloud

| Módulo | Máster | Estado | Evidencia en el repo | Acción | Apuntes |
|---|---|:-:|---|---|---|
| DevOps y CI/CD | Completada | ✅ | `ci.yml`, `docs.yml`, `release-please.yml`; ADR 0013 (puerta local de calidad) | CI en jobs paralelos (Fase 5) | |
| Cloud computing: proveedores, IA en cloud, IaC, costes | Completada | 🟡 | Railway + Supabase. Sin infraestructura como código; entornos de PR de Railway generando coste | Desactivar o limitar los previews (Fase 1.5) | |
| Bases de datos: relacionales, no relacionales, vectoriales | Completada | 🟡 | Postgres con RLS en las tablas del esquema, `pgvector` para pitches. El estado de negocio aún vive en `data.json` | Fase 3 (sacar el estado del JSON) | |
| Contenerización (Docker, Kubernetes) | Completada | ❌ | Sin `Dockerfile`; tres configuraciones de build (`railway.json`, `nixpacks.toml`, `railpack.json`) | Un solo build; valorar un `Dockerfile` reproducible. Kubernetes: no aplica (YAGNI) | |
| LangChain con Python, Gradio | Completada | ➖ | Fuera del stack del proyecto | — | |
| LLMOps: observabilidad y evaluations | Completada | 🟡 | `ai_token_ledger` y `agent_execution_logs`; ledger de producción vacío según ADR 0006; eval solo de acordes (`npm run eval:acordes`) | Golden set y `npm run eval:llm`, traza por llamada (Fase 6.2–6.3) | |
| Multi-Agents (Google ADK) | Completada | 🟡 | Agentes propios sin framework | ADR de por qué no se usa ADK | |

## 9. Seguridad

| Módulo | Máster | Estado | Evidencia en el repo | Acción | Apuntes |
|---|---|:-:|---|---|---|
| Desarrollo seguro: Security by Design, amenazas, MITRE, OWASP 2025 | Completada | 🟡 | `AGENTS.md` §2 (multi-tenancy, trust boundary); skill `security-multitenancy` | Modelo de amenazas escrito (una página) | |
| Metodologías: SSDLC, DevSecOps, Shift Left, Snyk | Completada | 🟡 | CodeQL ✅. Sin `npm audit` ni escaneo de secretos; sin Snyk | `npm audit` y gitleaks en CI (Fase 0.7) | |
| Prácticas de codificación segura: validación, authN/authZ, APIs, arquitectura segura | Completada | 🟡 | `getTargetBandId` aplicado de forma consistente (barrido sin huecos explotables). Sin validación de entradas (no hay zod): `bands.ts` guarda `{...req.body, id}` | zod + `validar(schema)` (Fase 2.2) | |
| Uso de la IA en el desarrollo seguro | Completada | ✅ | Skills `owasp-llm-security-auditor` y `cyber-and-trust-guardian`; PR #240 corrige inyección en el prompt del chat | `/chat` aún sin limitador de IA (Fase 1.1) | |

**OWASP Top 10 (los diez puntos del módulo) frente al repositorio**

| # | Riesgo | Estado | Evidencia | Falta |
|---|---|:-:|---|---|
| A01 | Broken Access Control | ✅ | `server/utils/bandAccess.ts` (`getTargetBandId`), test `bandIdTrustBoundary`, RLS | Confirmar las rutas fuera de `getTargetBandId` una a una |
| A02 | Cryptographic Failures | 🟡 | HMAC con comparación en tiempo constante; sesión de 30 días en el JSON de estado | Hash del token de sesión (Fase 3) |
| A03 | Injection | 🟡 | PR #240: rutas de fichero confinadas, regex lineales, prompt del chat saneado | Zod en entradas (Fase 2.2) |
| A04 | Insecure Design | 🟡 | Aprobación humana de agentes (ADR 0005), rate limiting | Cuota de IA por banda (Fase 2.5) |
| A05 | Security Misconfiguration | 🟡 | CSP mínima, helmet; sin `trust proxy`; tres builds | Fase 1.7 |
| A06 | Vulnerable and Outdated Components | 🟡 | Dependabot; 11 PR abiertos; sin `npm audit` | Fase 0.7 |
| A07 | Identification and Authentication Failures | 🟡 | Cookie `httpOnly:false` por diseño documentado; sin revocación al cambiar contraseña *(sospecha)* | Fase 6.5 |
| A08 | Software and Data Integrity Failures | 🟡 | Webhooks de Stripe firmados; `npm ci` en CI pero no en el build de Railway | Fase 1.7 |
| A09 | Logging and Monitoring Failures | 🟡 | Sentry; PII en logs (email del reseteo de contraseña) | Logger con redacción |
| A10 | SSRF | ✅ | `server/utils/ssrfGuard.ts`; los scrapers de leads pasan por `fetchUrlExternaSegura` (PR #240) | — |

## 10. Desarrollo potenciado por IA (proyectos) y bloques optativos

| Módulo | Máster | Estado | Nota | Apuntes |
|---|---|:-:|---|---|
| Proyectos front, IA, backend y mobile; Práctica de desarrollo moderno con IA | Incompleta | ➖ | Son prácticas del máster. Sus lecciones sobre Engram, Skills y SDD sí encajan con `AGENTS.md`, `skills/` y `SDD.md` | |
| Primeros pasos del TFM | Incompleta | ➖ | Si BandManager.io es el TFM, esta matriz sirve como evidencia de aplicación de cada módulo | |
| Masterclass: DDD, evaluar LLMs, Docker con IA, GitHub + agentes | Incompleta | 🟡 | **DDD** → Fase 2.4 (un dominio primero); **evaluar LLMs** → Fase 6.2; **Docker** → contenerización (§8); **GitHub + agentes** → flujo de PR y revisión | |
| Productividad, soft skills, emprendimiento, inglés, comunicación | Incompleta | ➖ | No aplican al código | |

---

## Orden de estudio sugerido (para que el temario pendiente alimente cada fase)

Los módulos del máster que aún figuran como **Incompleta** o **Pendiente** y que desbloquean trabajo del plan:

| Antes de… | Conviene ver… |
|---|---|
| Fase 2.4 (ruta fina → servicio → db) | *Aplicando Clean Architecture con TypeScript* y *Antipatrones* |
| Fase 2.3 (romper ciclos con eventos internos) | *Arquitecturas distribuidas y comunicación entre servicios* (solo eventos y outbox) |
| Fase 3 (sacar el estado de `data.json`) | *Decisiones arquitectónicas clave – Parte 2*, *Monolito modular* |
| Fase 4 y 0.8 (a11y, modales) | *Usabilidad: heurísticas y a11y* |
| Fase 5 (E2E, contenedores) | *Docker con IA* (Masterclass) y *Contenerización* repasada |
| Fase 6 (evals, RGPD) | *¿Cómo evaluar LLMs?* (Masterclass), directos de Seguridad |

## Cómo mantener esta matriz

1. Al cerrar una fase, cambia el estado de las filas afectadas y la fecha al pie.
2. Si el máster actualiza el temario, sustituye `TEMARIO_BIG_SCHOOL.md` por el nuevo índice y revisa solo las filas nuevas.
3. Las acciones sin fase (por ejemplo «ADR de por qué no LangChain») se pueden hacer en PR de documentación de menos de 50 líneas.

*Última revisión: 2026-10-13. Estado de las filas tomado del repositorio en `main` tras el PR #240.*
