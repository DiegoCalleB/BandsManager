# BandManager.io

El sistema operativo de una banda independiente: **encontrar salas, cerrar fechas, ensayar, tocar y cobrar desde un solo sitio**, con agentes de IA que hacen el trabajo repetitivo y una persona que aprueba lo importante. Pensado para grupos, solistas, monologuistas y cualquiera que tenga que buscar escenarios donde actuar. Es también el núcleo técnico de un Trabajo Fin de Máster sobre desarrollo de software asistido por IA agéntica (Máster de Desarrollo con IA, The Big School).

> Las reglas de desarrollo (seguridad, multi-tenancy, agentes, estilo) viven en **[AGENTS.md](./AGENTS.md)**. Este README es la puerta de entrada; no las duplica.

## Para qué existe

Una banda DIY hace, sin cobrar por ello, el trabajo de cinco profesionales: **booker** (buscar y convencer a las salas), **tour manager** (logística y rutas), **director musical** (ensayos y setlists), **contable** (quién cobra y quién paga) y **community manager** (redes y fans). La mayoría de la gente que toca pierde más horas en Excel, correos sin respuesta y WhatsApps que ensayando. BandManager.io convierte esas cinco figuras en una única plataforma asistida por IA.

Tiene tres finalidades reales, en este orden:

1. **Producto: quitarle trabajo de despacho a quien hace música.** El caso de uso central es el booking. La IA descubre salas, redacta un pitch breve y sin clichés con el tono de la banda, lee las respuestas y propone la réplica. La persona solo revisa y aprueba. Alrededor se construye lo que una banda necesita el día de la gira: calendario, repertorio, EPK, fans y finanzas.
2. **Negocio: un SaaS B2C para el músico independiente.** Escalonado por planes (de gratis a 79 €/mes) y con un camino de ingresos extra, la comisión por acuerdos de concierto, ya especificado en [`docs/planes/`](./docs/planes/). Hoy los planes de pago están desactivados a propósito: toda banda nueva entra en modo *promo* mientras se valida el producto.
3. **Académica: demostrar cómo se construye software serio con IA agéntica.** Es el TFM. El repositorio documenta cómo se trabaja con agentes de código (Claude Code, Gemini, Cursor, Open Code) con reglas compartidas, skills, hooks y tests que impiden que un agente rompa lo que no debe. La parte de IA *dentro* del producto y la parte de IA *que construye* el producto son dos caras del mismo experimento.

### Qué lo diferencia

- **Human-in-the-loop de verdad.** Un agente nunca envía un email por su cuenta. El código lo impide: sin aprobación humana, interruptor global `AGENT_EMAIL_MODE=send` y modo de despacho explícito, solo se crean borradores.
- **Multi-tenancy estricta.** Ninguna banda ve datos de otra. La banda se resuelve siempre en el servidor desde la sesión, nunca desde lo que envía el cliente, y un test estático rompe el build si alguien reintroduce el patrón inseguro.
- **Cada banda manda su propio correo.** Los pitches salen del buzón de la banda (Gmail OAuth2 o IMAP/SMTP), no de un dominio genérico de la plataforma: el correo llega firmado por la propia banda.
- **Todo en uno, pero simple.** Mucha funcionalidad con una interfaz que no satura: la complejidad vive en el backend y la IA, y la pantalla sigue las reglas de [AGENTS.md §6](./AGENTS.md).

## Qué hace

Cada módulo aparece en el menú lateral según el plan de la banda (ver [Planes](#planes)). Los límites y permisos se validan también en el servidor, no solo en la interfaz.

### Booking: encontrar salas y conseguir fechas

El CRM de booking (`BookingCRM`) es el centro de la app. Cada sala, festival o medio es un *lead* con un embudo de estados (`nuevo` → `contactado` → `respondido` → `negociando` → `confirmado`, más `aplazado` y `no_interesado`) y una cola aparte de revisión humana de lo que redactan los agentes.

- **Descubrimiento de salas:** búsqueda en Google Places, campañas de búsqueda masiva por ciudad, artistas similares, historial de setlist.fm, MusicBrainz, Bandsintown y fuentes de datos culturales abiertos. Detección de duplicados antes de crear un lead.
- **Enriquecimiento:** scraping de contacto, direcciones y web de cada sala, validación de emails (MX y entregabilidad), y avisos de eventos locales que compiten por la misma audiencia.
- **Importación y exportación:** Excel, con acciones en bloque sobre la selección.
- **Campañas:** envíos segmentados con plantillas de asunto y cuerpo por tipo de lead (salas, festivales, discotecas, medios, grupos, managements, ayuntamientos) y simulación de booking antes de lanzar.
- **Vistas de apoyo:** secciones separadas para salas, medios y management, y mapa de salas.

### Agentes de IA (con aprobación humana)

Cuatro agentes se reparten el ciclo; un planificador deposita los trabajos en una cola (`agent_jobs_queue`) en lugar de ejecutarlos dentro de Express.

| Agente | Qué hace |
|---|---|
| **Scout** | Descubre y enriquece salas, las deja en `nuevo`. |
| **Redactor** | Escribe un pitch breve (menos de 120 palabras) con el *Band DNA* y el *Tone DNA* de la banda. Un juez LLM (`pitchJudge`) lo evalúa y lo refina. Aprende de las ediciones humanas. |
| **Enviador** | Solo actúa sobre leads aprobados. Respeta la ventana comercial de la banda, un tope diario y no reintenta rebotes. |
| **Lector** | Revisa la bandeja cada ~60 s, empareja respuestas por hilo, analiza sentimiento e intención, y propone la réplica. |

Nada sale sin que una persona apruebe el borrador. Con `AGENT_EMAIL_MODE=draft` (por defecto) el Enviador solo deja borradores en la bandeja de la banda. Cada banda conecta su propio buzón, preferentemente por Gmail OAuth2 o, si no, por IMAP/SMTP. Los fallos de negocio esperables (sala sin email, buzón no conectado) se registran en un panel propio.

### Negociación y acuerdos

- **Copiloto de acuerdo y logística** sobre cada lead: caché, taquilla, rider y hospitalidad.
- **Acuerdos de concierto** que se envían a la sala por un enlace público con token; la sala los revisa y firma sin crear cuenta.
- **Simulador de punto de equilibrio** por concierto: ingresos, gastos y ruta con cálculo de combustible.
- **Aportaciones por acuerdo:** una banda puede apoyar un bolo con una donación (Stripe).

### Calendario, ensayos y gira

- **Calendario** de conciertos y ensayos con tiempo meteorológico por evento, recordatorios, sincronización externa y hoja de ruta.
- **Ensayos:** convocatoria, orden del día, cronómetro por bloque, grabación y acta, y modo local en vivo.
- **Tour Manager:** rutas, logística y tarjeta de direcciones por fecha.

### Repertorio y setlists

- **Canciones y discografía:** catálogo con filtros, álbumes, portadas, letras, acordes, notas por miembro y subida de audio en bloque.
- **Análisis de audio:** tonalidad, BPM, densidad de onsets, energía y *cues*, tanto del audio de la banda como del original en las versiones.
- **Setlists:** gráfico de energía, comprobación de compatibilidad de tonalidad/BPM entre temas contiguos, análisis con IA, un generador de setlist perfecto y exportación a PDF.
- **Modo Escenario** para tocar en directo con el reproductor del setlist, afinador y metrónomo.
- **Concierto → Álbum:** procesa una grabación en directo (descarga, análisis, detección de cortes) y la convierte en canciones del catálogo.

### Estudio de canciones y música IA

- Generación de pistas de acompañamiento y jingles con Gemini, y bases rítmicas con instrumentos sintetizados (guitarra, violín, handpan, percusión) con Tone.js.
- Separación de stems en la nube y transposición de audio, con caché y cola de reintentos.
- Exportación a MIDI, y subida de la estructura de una canción.
- Las maquetas y stems son de la banda: se guardan en Storage bajo una ruta acotada por `bandId`.

### EPK y fans

- **EPK (dossier web):** bloques editables de perfil, música, prensa, archivos, donaciones y firma con QR; plantillas; traducción; logo generado con IA. La ruta pública `/epk` se renderiza fuera del traductor para que no toque nombres de canciones.
- **Seguimiento:** aperturas, clics y descargas del dossier, con tokens firmados.
- **Fans:** captación por QR con consentimiento RGPD explícito, vista de comunidad y cuadro de mando, y página de aterrizaje.
- **QR:** exportación de códigos para conciertos y difusión.

### Contenido y redes

- **Reels:** a partir de vídeos de la banda (YouTube, TikTok, Instagram) detecta fragmentos con energía, corta clips con ffmpeg, escribe el copy con el Tone DNA y los muestra en un mockup de móvil.
- **Crecimiento social:** métricas reales de redes, plan de crecimiento y publicación programada.

### Finanzas y merchandising

- Ingresos y gastos de la banda con resumen, y las métricas de cada concierto.
- Merchandising (de momento solo visible para administradores).

### Agente Mánager (chat)

Chatbot con herramientas (`server/services/chatTools.ts`) para consultar y actuar sobre los datos de la banda, con modo de conversación conmutable.

### Cuentas, multi-banda y onboarding

- Una persona puede pertenecer a varias bandas (plan Cabeza de Cartel hasta 5) y cambiar entre ellas; los miembros se invitan por un enlace de un solo uso.
- Asistente de configuración inicial de 12 pasos tras el primer login y tutoriales por módulo.
- Idioma, tema, tipografía y notificaciones (toasts y push del navegador) configurables por usuario.

### Práctica, directo y estudio personal

- **Modo práctica** (`PracticeModePanel`): reproduce varias pistas de una canción a la vez, con transposición en tiempo real, bucle de compases, metrónomo y balance de volumen. **Modo Escenario** para tocar en directo siguiendo el setlist.
- **Afinador y metrónomo** integrados, y un visor de **acordes** por canción.
- **Audio por canción:** forma de onda, pistas por instrumento, ideas con comentarios, y ayudas para llevar los stems a un DAW (guía para Cubase incluida).

### Landing pública, PWA y demo

- **Landing en `/`** para quien no tiene sesión, con capturas y una banda de demo ficticia (`e2e/fixtures/demoBand.ts`) generadas por script, más una landing específica para el TFM (`/tfm`).
- **PWA instalable** (manifest, iconos, service worker) y **notificaciones push** del navegador.
- **Página pública de acuerdo** (`/deal/:token`), **EPK público** (`/epk`) y **captación de fans**: las únicas rutas que se abren sin cuenta, por eso llevan limitador de ritmo y tokens firmados.

### Seguridad y fiabilidad (parte del producto, no un añadido)

- **Aislamiento por banda** en capa de aplicación (`getTargetBandId`) con un test estático en CI. Las políticas RLS de Supabase hoy no restringen por banda, así que no son una red de seguridad (ver [AGENTS.md §2.1](./AGENTS.md)).
- **Defensa contra SSRF** en todo `fetch` a URLs de usuario, **protección frente a inyección de prompt** en lo que el Scout scrapea y el Lector lee, y escape de HTML en los correos.
- **Autenticación:** Google verificado en servidor, contraseñas de admin solo por variable de entorno, invitaciones de un solo uso y limitadores de ritmo en login, IA, render y donaciones.
- **Observabilidad en dos capas:** los fallos de negocio esperables de los agentes van a un panel propio (`agent_execution_logs`) y el resto a Sentry (opcional).
- **Migraciones SQL idempotentes** que se aplican solas al arrancar, y tests que vigilan que el servidor no escriba columnas que no existen.

### Planes

| Plan | Precio | Créditos IA/mes | Para qué |
|---|---|---|---|
| Promo / Promo+ | 0 € | 0 | EPK, QR, fans, calendario y repertorio (Promo+ añade setlists y discografía). |
| Ensayo | 0 € | 100 | Primer contacto con booking y agentes (10 leads). |
| Local | 15 € | 300 | Booking con 50 leads y contactos de medios. |
| De Gira | 29 € | 800 | Todo ilimitado en una banda, más Tour Manager y Reels. |
| Cabeza de Cartel | 79 € | 2.500 | Hasta 5 bandas, finanzas y agentes en paralelo. |

Los límites exactos y el módulo de cada plan salen del código (`src/utils/planPermissions.ts`, `server/utils/planLimits.ts`); la tabla de [AGENTS.md §2.3](./AGENTS.md) es la referencia. Los créditos IA se descuentan por banda y no tienen relación con el ledger de deuda de IA.

**Principio central: human-in-the-loop.** Ningún agente envía un email sin aprobación humana explícita (detalle en [AGENTS.md §3](./AGENTS.md)).

## Stack

- **Frontend:** React 19 + Vite 6 + Tailwind CSS v4, `motion`, Tone.js.
- **Backend:** Express 4 + TypeScript en Node 22 (`server.ts`), estado en memoria sincronizado con Supabase.
- **Datos:** Supabase (PostgreSQL) como única fuente de verdad, Supabase Storage para multimedia.
- **IA:** Gemini (`@google/genai`), con DeepSeek/OpenAI opcionales; Replicate/fal para stems.
- **Servicios:** Stripe (planes), Resend (emails transaccionales), Sentry (opcional).
- **Despliegue:** Railway (`railway.json`, healthcheck en `/api/health`); las migraciones SQL se aplican solas en `npm start`.

## Puesta en marcha

Requiere Node 22.

```bash
npm install
cp .env.example .env     # mínimo: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY
npm run dev              # Express + Vite en http://localhost:3000
```

Sin `.env` la app también arranca, con los usuarios semilla de `src/db_seed.ts` y estado en memoria, pero sin IA ni Supabase reales. Cada integración opcional (Stripe, Resend, Gmail OAuth, Sentry, stems) se degrada sola si falta su variable; la referencia completa está comentada en [`.env.example`](./.env.example).

`AGENT_EMAIL_MODE` está en `draft` por defecto: los agentes dejan borradores y **no envían** hasta que se pone a `send` en el servidor.

## Scripts

| Comando | Para qué |
|---|---|
| `npm run dev` | Servidor de desarrollo. |
| `npm run build` / `npm start` | Typecheck + build / migraciones y servidor de producción. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm test` | Tests unitarios (Vitest). |
| `npm run check:fast` | Typecheck + test de la frontera de confianza `band_id`. |
| `npm run test:e2e` | Smoke suite y journey de onboarding (Playwright, sin credenciales). |
| `npm run test:visual` | Regresión visual (`:update` solo para cambios de diseño deliberados). |
| `npm run lint:eslint` | ESLint (la deuda existente va con ratchet en CI). |
| `npm run migrate:check` | Lista las migraciones SQL pendientes. |
| `npm run verify:docs` | Comprueba que las rutas citadas en la documentación existen. |
| `npm run graph:sync` | Regenera el grafo de conocimiento de `docs/knowledge_graph/`. |

## Estructura

```
server/        Express: routes/ (HTTP) · services/ (agentes, scheduler, emails) · db/ (Supabase) · utils/ · middleware/
src/           React: components/ · hooks/ · utils/ · services/api.ts (cliente HTTP único) · context/
supabase/      Migraciones SQL idempotentes (el esquema completo está en supabase_schema.sql)
e2e/           Playwright: smoke, journey y regresión visual
scripts/       Migraciones, auditorías de diseño y utilidades de desarrollo
skills/        Skills para agentes de código (espejadas en .claude/, .gemini/, .opencode/ y .cursor/)
docs/          planes/ (especificaciones) · referencia/ (arquitectura, diseño) · knowledge_graph/ (Obsidian)
```

El mapa detallado está en [AGENTS.md §7](./AGENTS.md). El backlog de producto, en [BACKLOG.md](./BACKLOG.md).

## Documentación

- [AGENTS.md](./AGENTS.md): reglas del proyecto (precedencia sobre convenciones genéricas).
- [docs/referencia/](./docs/referencia/): arquitectura del motor de audio y stems, sistema de diseño Espectro, manual de negociación del Redactor, compatibilidad entre herramientas de IA.
- [docs/planes/](./docs/planes/): anti-fraude y acuerdos de gira, gestión de tokens IA, BandSplit.
- [docs/knowledge_graph/](./docs/knowledge_graph/index.md): grafo de arquitectura navegable en Obsidian.

## Hasta dónde hemos llegado

*Situación a 6 de octubre de 2026.* La aplicación es completa y funciona de punta a punta; lo que queda es validar con bandas reales, reactivar el cobro y cerrar riesgos legales.

**Tamaño del proyecto:** unas 270.000 líneas de TypeScript (≈197.000 en `src/`, ≈76.000 en `server/`), 283 endpoints, 47 tablas, 31 migraciones, más de 230 componentes React y más de 1.400 tests unitarios, además de los E2E de Playwright y 15 capturas de regresión visual.

### Construido y funcionando

| Área | Estado |
|---|---|
| Booking CRM, descubrimiento y enriquecimiento de salas | Funcional, con importación y exportación. |
| Agentes Scout, Redactor, Enviador y Lector | Funcionales, con cola de trabajos, tope diario y revisión humana. |
| Acuerdos de concierto con enlace público y firma por nombre, cargo y marca de tiempo, con hash SHA-256 | Funcional. |
| Repertorio, setlists, análisis de audio, estudio y stems | Funcional. |
| Calendario, ensayos y Tour Manager | Funcional. |
| EPK público, fans con consentimiento RGPD y QR | Funcional. |
| Reels, redes y publicación programada | Funcional. |
| Multi-banda, invitaciones, onboarding de 12 pasos y PWA | Funcional. |
| Landing pública con banda de demo | Funcional, con salvedades (ver deuda). |
| Seguridad: multi-tenancy, SSRF, inyección de prompt, auditorías de octubre | Hecho y cubierto por tests. |

### Construido pero a medias

- **Facturación con Stripe:** el flujo existe y tiene tests, pero está desactivado a propósito y hay arreglos pendientes (idempotencia, cancelación al cambiar de plan, descuento de créditos en servidor) que hay que cerrar **antes** de reactivarlo. Detalle en [BACKLOG.md](./BACKLOG.md).
- **Datos de bandas concretas en el código** (textos de ejemplo y la regla «evento sin banda = Bakandeya»): limpiado en parte; queda una migración de datos antes de poder borrar el resto.
- **Diseño:** el sistema Espectro está aplicado en bloque; faltan primitivas (`Tabs`, `IconButton`) y envolver en portal unos 35 modales que se recortan en móvil.

### Solo especificado (aún no se ha escrito código)

- **Custodia de pagos tipo escrow** y los distintos modelos de liquidación del bolo ([`plan_anti_fraude`](./docs/planes/plan_anti_fraude.md)).
- **BandSplit / TourCount:** reparto de gastos de gira y de local, con OCR y voz ([`splitband`](./docs/planes/splitband.md)).
- **Modelo económico de IA** con texto en uso razonable y cupos de estudio ([`plan_gestion_tokens_ia`](./docs/planes/plan_gestion_tokens_ia.md)).
- **Crecimiento:** automatización de redes con ManyChat, directorio SEO de salas por ciudad y herramientas gancho públicas.
- **Modo escenario sin conexión**, subida de vídeos de fans por QR y análisis de acordes a partir del audio real.

### Riesgos antes de abrirlo a usuarios reales

Hay dos bloqueantes y varios importantes documentados en [AGENTS.md §8](./AGENTS.md): descarga de YouTube sin verificar titularidad, contraseñas de aplicación de correo guardadas sin cifrar, ausencia de baja en los emails comerciales, base de legitimación RGPD sin documentar y falta de borrado/exportación de cuenta. El README no los relativiza: con usuarios de prueba el producto se puede usar hoy, con clientes de pago aún no.

### Siguientes pasos razonables

1. Cifrar `app_password` y exigir titularidad en las descargas de vídeo.
2. Añadir el mecanismo de baja a los emails de los agentes.
3. Probar con una banda real el flujo completo lead → aprobación → borrador → respuesta.
4. Cerrar los arreglos de billing y reactivar los planes.
5. Decidir la licencia (ver abajo) y publicar las páginas legales.

## Licencia

El repositorio incluye [`LICENSE`](./LICENSE) (AGPL-3.0) y [`TERMS_OF_SERVICE.md`](./TERMS_OF_SERVICE.md) (todos los derechos reservados). **Ambos se contradicen**; está pendiente decidir cuál aplica.
