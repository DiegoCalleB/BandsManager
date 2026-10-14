# Plan — Reels virales de verdad (generación, copy, programación y publicación)

> Objetivo: que cada Reel generado tenga **retención completa + rewatch** (vídeos que se ven
> 2-3 veces sin que el usuario lo decida) y que título/descripción no sean mejorables a mano.
>
> Regla de honestidad: nadie puede *garantizar* la viralidad. Lo que sí se puede garantizar es
> que **ningún Reel salga con un defecto evitable** y que el sistema **aprenda de métricas reales**
> de cada banda. Este plan va a por esas dos cosas.

---

## Estado de ejecución (2026-10-14)

| Bloque | Estado | Dónde |
|--------|--------|-------|
| D1 publicación simulada | ✅ eliminada: solo `publicado` con el id real de Instagram | `server/services/socialPublisher.ts`, `publicadores/instagramReels.ts` |
| D2/D4 cron + claim atómico | ✅ worker cada 60 s, `UPDATE … WHERE estado IN (…)` | `socialPublisher.ts`, `db/social.ts` |
| D3 zona horaria | ✅ hora de pared en la zona de la banda, con cambio de hora | `utils/programacionPosts.ts` |
| D5 hook quemado | ✅ | `utils/hookRotulo.ts`, `utils/clipFiltros.ts` |
| D6/D7 volumen y codificación | ✅ −14 LUFS, crf 19, 30 fps, GOP 2 s | `utils/clipFiltros.ts` |
| D8 loop perfecto | ✅ cruce final→inicio + ajuste del corte ±1,5 s | `utils/clipFiltros.ts`, `utils/loopPerfecto.ts` |
| D9/D10 Hook Doctor | ✅ fallback de modelo, ledger, retención `null` sin IA | `services/hookDoctor.ts` |
| D12 copyright | ✅ solo se autopublica con canal de la banda o declaración expresa | `utils/derechosClip.ts`, tabla `reel_clips` |
| Seguridad (hallazgo nuevo) | ✅ `/public/epk` devolvía el token de Instagram de la banda | `utils/enlacesPublicos.ts` |
| Fase 3 · copy perfecto | ✅ auditoría determinista + set dorado; 5 candidatos con arquetipos, juez con rúbrica, el copy de la banda compite; botón "Mejorar copy" | `utils/auditoriaCopyReel.ts`, `services/copyPerfecto.ts`, `routes/reelsTexto.ts`, `CopyPerfectoPanel.tsx` |
| Fase 5 · métricas y aprendizaje | ✅ worker de métricas reales (1/24/72/168 h), KPI de rewatch, Thompson sampling de formato por banda; se inyecta en el análisis y el selector solo marca "recomendado" con datos | `services/metricasReels.ts`, `utils/aprendizajeReels.ts`, tabla `reel_metricas`, `routes/reelsAprendizaje.ts` |
| Montaje al beat | ✅ rejilla de pulsos y compases (onsets + BPM de `audioKey`); el flash cae solo en los compases reales; el cierre del loop se encaja en un pulso | `utils/rejillaBeats.ts`, `services/clipNovedades.ts` (`analizarTramo`) |
| Fase 6 · control de calidad | ✅ negro, congelado, silencio, volumen, formato, duración, hook y pista de audio; bloquea la autopublicación | `utils/controlCalidadClip.ts`, `services/controlCalidad.ts`, `ClipQualityReport.tsx` |
| Interruptores del estudio sin efecto (hallazgo nuevo) | ✅ loop, zoom y smart-pan ya llegan al render | `useClipRendering.ts` |

**Pendiente** (en orden): YouTube Shorts y TikTok reales · Fase 4 (hora óptima con datos) · aplicar la
auditoría de copy también al análisis inicial · validar con una cuenta real los nombres de las
métricas de Meta (`views`, `ig_reels_avg_watch_time`) ·
tras desplegar: aplicar `20261104_reels_publicacion_real.sql` y probar con una cuenta real de
Instagram Business (la API de Meta solo se ha probado con respuestas simuladas).

**Lección 2:** el beat-drop original (`eq=…mod(t,4)`) sin `eval=frame` no parpadeaba cada 4 s: ffmpeg evalúa la expresión una vez y aclaraba TODO el vídeo. Medido: 172 fotogramas a luminancia 126 contra 202 en los de golpe solo con `eval=frame`.

**Lección:** el plan de filtros pasó los tests de texto y aun así fallaba en el ffmpeg de producción
(`xfade` exige frame rate constante; `acrossfade` no emite audio). Por eso existe
`clipFiltros.ffmpeg.test.ts`, que renderiza de verdad.

---

## 0. Diagnóstico del estado actual (verificado en código, 2026-10-14)

| # | Hallazgo | Dónde | Gravedad |
|---|----------|-------|----------|
| D1 | **La publicación es simulada.** `publishSocialPostNow` inventa un `published_id`, construye una URL falsa, marca el post como `publicado` y le mete **métricas aleatorias** (`Math.random()`). Además suma seguidores falsos a `social_metrics`. | `server/services/socialPublisher.ts` | 🔴 Bloqueante: contamina cualquier bucle de aprendizaje y engaña al usuario. |
| D2 | **No hay cron de publicación.** `publishDueScheduledPosts` solo se ejecuta llamando a mano a `POST /social/run-scheduled-publisher`. Programar un Reel no lo publica. | `server/routes/posts.ts` | 🔴 |
| D3 | **Zona horaria rota.** Compara `fecha`/`hora_programada` (texto) con `toTimeString()` del servidor (UTC en Railway): un Reel a las 20:30 de Madrid sale a las 22:30. | `socialPublisher.ts:113-128` | 🔴 |
| D4 | **Sin claim atómico.** Dos ejecuciones simultáneas publicarían el mismo post dos veces. | `socialPublisher.ts` | 🟠 |
| D5 | **El `hookText` se genera pero nunca se quema en el vídeo.** El rótulo de los 2 primeros segundos —lo que más retención da— no llega al MP4. | `reels.ts` `/cut-video-clip` | 🔴 |
| D6 | **Sin normalización de volumen.** Los directos salen con sonoridad aleatoria; IG/TikTok normalizan y un audio flojo pierde pegada. | `/cut-video-clip` | 🟠 |
| D7 | **Calidad de codificación justa** (`-preset veryfast -crf 23`). Las plataformas recomprimen: si entra mediocre, sale peor. | `/cut-video-clip` | 🟡 |
| D8 | **No hay diseño de loop.** El final del clip no enlaza con el inicio → cero rewatch "sin querer". | `viralSignals.ts`, `reelsCore.ts` | 🔴 (es la palanca del "verlo 3 veces") |
| D9 | `ai-hook-doctor` llama a `ai.models.generateContent` directo: **sin fallback de modelo y sin registrar coste en `aiLedger`**. | `reels.ts:1188` | 🟠 |
| D10 | `estimatedRetention3s` lo **inventa el LLM** y se muestra como si fuera una métrica. | `ai-hook-doctor` | 🟠 |
| D11 | El copy se parsea con `extractJsonObject` sobre texto libre en vez de *structured output*; una sola pasada, sin candidatos ni juez. | `/analyze-video-highlights` | 🟡 |
| D12 | **Riesgo legal**: auto-publicar clips sacados de YouTube sin verificar titularidad = strike de copyright para la banda (ya señalado en AGENTS.md). | `reels.ts` | 🔴 antes de autopublicar |

**Lo que ya está bien y se reutiliza:** ventanas virales con contraste/arranque y cambios de plano
(`viralSignals.ts`), subtítulos karaoke palabra a palabra, `buildEstrategiaBlock` por tipo de
contenido, memoria de feedback (`reelFeedback.ts`), cola `agent_jobs_queue` con `scheduled_at`,
lectura de insights de Instagram (`metrics.ts`), Tone DNA de banda.

---

## Fase 1 — Cimientos honestos (bloqueante, va primero)

Sin esto, todo lo demás optimiza sobre datos falsos.

1. **Matar la simulación (D1).** `publishSocialPostNow` nunca marca `publicado` sin un ID real
   devuelto por la plataforma. Sin cuenta conectada → modo **"publicación asistida"** explícito:
   notificación con vídeo descargable + copy al portapapeles + botón "ya lo he subido" (pide la URL).
   Borrar el bloque que inventa métricas y seguidores.
2. **Publicadores reales por plataforma**, detrás de una interfaz común `PublicadorPlataforma`:
   - **Instagram Reels** — Graph API Content Publishing: contenedor `media_type=REELS` con
     `video_url` (URL pública de Supabase Storage), *polling* de `status_code` hasta `FINISHED`,
     luego `media_publish`. Incluye `share_to_feed` y `cover_url`/`thumb_offset`.
   - **YouTube Shorts** — Data API `videos.insert` (OAuth de la banda, vertical ≤ 3 min).
   - **TikTok** — Content Posting API. Hasta pasar la auditoría de TikTok, solo modo *inbox/draft*
     (el usuario confirma en la app). No prometer autopublicación antes.
3. **Programación en UTC (D3).** Columna `scheduled_at timestamptz` + `zona_horaria` de la banda;
   `fecha`/`hora_programada` pasan a ser solo de presentación. Test con DST (último domingo de octubre).
4. **Cron + claim atómico (D2, D4).** Encolar en `agent_jobs_queue` y dejar que `agentQueueWorker`
   lo consuma. Claim con `UPDATE … SET estado='publicando' WHERE id=$1 AND estado IN ('aprobado','en_cola') RETURNING *`
   + clave de idempotencia por post/plataforma. Reintentos con backoff solo en errores transitorios.
5. **Puerta de copyright (D12).** Autopublicación solo si el canal de YouTube origen está
   verificado como de la banda (OAuth del canal o match con `band_social_accounts`) o el vídeo es
   subida propia. Si no, se queda en "publicación asistida" con aviso.
6. **Hook Doctor sin trampas (D9, D10).** Pasar a `generateContentWithFallback` con `bandId`
   (ledger). Quitar `estimatedRetention3s` o etiquetarlo "estimación IA, no métrica".

**Hecho cuando:** un Reel programado a las 20:30 Europe/Madrid aparece en Instagram a las 20:30,
una sola vez, con su `published_id` real, y nada en la BD tiene métricas inventadas.

---

## Fase 2 — El vídeo "perfecto" (render)

Todo dentro de `/cut-video-clip` + funciones puras en `reelsCore.ts` (testables con Vitest).

1. **Hook quemado 0–2 s (D5).** Capa ASS propia (no `drawtext`): fuente de marca embebida vía
   `fontsdir`, caja con contraste garantizado, entrada animada de 150 ms, dentro de *safe zone*.
2. **Loop perfecto (D8) — la palanca del "verlo 3 veces".**
   - Nueva función pura `elegirPuntoDeLoop(curva, beats, inicio, fin)`: ajusta `endSec` al
     final de compás/frase cuya energía y tonalidad enlacen con el `startSec`.
   - Crossfade de audio 150–300 ms fin→inicio y última imagen ≈ primera (o corte en movimiento).
   - Sin "fade a negro" ni rótulo final: cualquier cierre explícito mata el rewatch.
   - Formato *loop* corto (7–15 s) como opción por defecto para conciertos/estribillos; formato
     *narrativo* (20–35 s) para ensayos y lore.
3. **Cold open / flash-forward.** Opción de abrir con 1–1,5 s del pico más alto del tramo y
   volver al contexto. Reutiliza `ventanasMasVirales` (ya mide el arranque).
4. **Montaje al beat.** `punchInZoom`/`beatDropFx` alineados a *downbeats* reales (BPM de
   `audioKey`), no a tiempos fijos.
5. **Subtítulos karaoke en safe zones.** Nada en el 20 % inferior ni en la franja derecha
   (botones de IG/TikTok). Máx. 2 líneas, 3–5 palabras por bloque.
6. **Audio (D6).** `loudnorm` a −14 LUFS integrados, true peak −1 dBTP, AAC 192 k / 48 kHz.
7. **Codificación (D7).** 1080×1920, 30 fps constantes, `-preset medium -crf 19`, GOP 2 s,
   `+faststart`. Más CPU: compensar con la cola de render (ya hay `renderConcurrencyLimiter`).
8. **Encuadre inteligente.** `smart_pan` → seguimiento de caras/persona más activa
   (detección por muestreo de fotogramas, con fallback al modo actual).
9. **Portada.** Elegir el fotograma más nítido con cara y hook visible → `cover_url`.

---

## Fase 3 — Título y descripción "perfectos"

1. **Structured output (D11)** con `responseSchema` de Gemini en vez de `extractJsonObject`.
2. **Generar → juzgar → elegir.**
   - Generador (modelo barato): 5 hooks + 3 copies por plataforma, cada uno etiquetado con su
     arquetipo (curiosidad, contraste, especificidad, POV, pregunta real, detrás de escena).
   - Juez (modelo fuerte) con rúbrica fija: anti-cliché, Read Aloud score (skill
     `prompt-craft-and-dna`), fidelidad al Tone DNA, encaje con el tramo real, longitud.
   - Se devuelven el ganador + 2 alternativas para A/B.
3. **Validadores deterministas** (funciones puras, TDD): longitudes por plataforma, primeros
   ~125 caracteres de IG autosuficientes (es lo que se ve sin "más"), 3–5 hashtags (no 8),
   lista negra de clichés y de *engagement bait* ("comenta SÍ si…", penalizado por Meta),
   cero hashtags dentro del texto.
4. **SEO de búsqueda.** IG y TikTok ya funcionan como buscadores: nombre de canción, banda,
   ciudad y género en texto plano en el copy y en el rótulo.
5. **Comentario fijado** generado y publicado automáticamente tras el post (IG `comments` + pin).
6. **Memoria con datos reales**: `reelFeedback` deja de alimentarse solo de estrellas y pasa a
   incluir qué arquetipos de hook rindieron más en esa banda (Fase 5).

---

## Fase 4 — Programación inteligente

1. **Hora óptima con datos de la cuenta**: `online_followers` de IG Insights por hora/día;
   el "20:30" fijo queda solo como fallback sin datos.
2. **Cadencia**: máx. 1 Reel/día por plataforma, nunca dos clips del mismo vídeo en 48 h,
   mezcla de tipos (directo / ensayo / lore).
3. **Trial Reels de Instagram** (se muestran primero a no seguidores) para probar variantes de
   hook sin quemar a la audiencia. *Verificar soporte en la Graph API antes de implementarlo.*
4. **Cross-post escalonado**: IG → TikTok +2 h → Shorts +1 día, con copy específico de cada una.
5. **Calendario con choques**: reutilizar `calendarConflicts` para no publicar encima de un
   anuncio de concierto.

---

## Fase 5 — Bucle de aprendizaje (lo que de verdad hace viral)

1. **Ingesta de métricas reales por Reel** a 1 h / 24 h / 72 h / 7 d desde IG Insights
   (`plays`, `reach`, `ig_reels_avg_watch_time`, `ig_reels_video_view_total_time`, `saved`,
   `shares`, `comments`) y YouTube Analytics (curva de retención).
2. **KPI estrella: `watch_time_medio / duración`.** > 100 % significa rewatch; **300 % es literalmente
   "lo han visto 3 veces"**. Secundarios: % visto completo, shares/alcance, saves/alcance.
3. **Features por Reel** guardadas (tipo, duración, arquetipo de hook, loop sí/no, cold open,
   hora, plataforma) → tabla `reel_performance`.
4. **Bandit (Thompson sampling) por banda** sobre arquetipo de hook × duración × loop: con pocos
   datos explora, con muchos explota. Sin ML pesado, una función pura con tests.
5. **Inyección en el prompt**: "En esta banda los hooks de contraste rinden 2,1× la mediana;
   los clips >20 s caen al 40 % de retención".

---

## Fase 6 — Quality gate pre-publicación

Ningún Reel se autopublica si falla algo de esto (vuelve a revisión humana — skill
`human-in-the-loop-flow`):

- `blackdetect` / `freezedetect` / `silencedetect` de ffmpeg sin positivos.
- Loudness dentro de ±1 LU del objetivo.
- Hook presente en 0–2 s y subtítulos dentro de safe zone.
- Duración dentro del rango del formato elegido; loop verificado si es formato loop.
- Copy pasa todos los validadores de la Fase 3.
- Puerta de copyright de la Fase 1 superada.

---

## Orden de ataque y estimación (noches de 1,5–2 h)

| Prioridad | Bloque | Noches aprox. |
|-----------|--------|---------------|
| 1 | Fase 1.1, 1.3, 1.4, 1.6 (quitar simulación, UTC, cron + claim, ledger) | 3–4 |
| 2 | Fase 2.1, 2.6, 2.7 (hook quemado, loudnorm, codificación) | 2 |
| 3 | Fase 2.2 (loop perfecto) + 2.4 (beat-sync) | 3–4 |
| 4 | Fase 1.2 Instagram real + 1.5 puerta de copyright | 4–5 |
| 5 | Fase 3 completa (candidatos + juez + validadores) | 3 |
| 6 | Fase 6 quality gate | 2 |
| 7 | Fase 5 ingesta de métricas + KPI rewatch | 3 |
| 8 | Fase 4 + bandit + YouTube/TikTok reales | 5+ |

## Cómo se valida

- **TDD** (skill `tdd-regression-guardian`) en todo lo puro: `elegirPuntoDeLoop`, conversión
  de zona horaria/DST, claim de publicación, validadores de copy, bandit.
- **Set dorado** de 20 vídeos reales (directo, videoclip, ensayo) para evaluar copy con el juez
  (skill `llm-evals-benchmark`) antes y después de cada cambio de prompt.
- **Métrica de negocio**: mediana de `watch_time/duración` de los Reels publicados por
  BandManager vs. los que la banda subía antes. Si no sube, el plan se revisa con datos.
