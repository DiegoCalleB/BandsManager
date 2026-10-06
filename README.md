# BandManager.io

Plataforma para bandas y artistas independientes que quieren dejar de perder horas buscando salas: **booking CRM con agentes de IA**, repertorio y setlists, EPK público, fans, finanzas de gira y generación de Reels. Es también el núcleo técnico de un Trabajo Fin de Máster sobre desarrollo de software asistido por IA agéntica (Máster de Desarrollo con IA, The Big School).

> Las reglas de desarrollo (seguridad, multi-tenancy, agentes, estilo) viven en **[AGENTS.md](./AGENTS.md)**. Este README es la puerta de entrada; no las duplica.

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

## Estado

Proyecto en desarrollo activo. Antes de abrirlo a usuarios reales hay riesgos legales y de seguridad documentados en [AGENTS.md §8](./AGENTS.md) (descarga de YouTube, credenciales de email sin cifrar, baja en emails comerciales, RGPD).

## Licencia

El repositorio incluye [`LICENSE`](./LICENSE) (AGPL-3.0) y [`TERMS_OF_SERVICE.md`](./TERMS_OF_SERVICE.md) (todos los derechos reservados). **Ambos se contradicen**; está pendiente decidir cuál aplica.
