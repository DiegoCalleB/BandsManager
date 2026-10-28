# Subsistemas Especializados — BandManager.io

Documentación técnica y operativa de los 13 subsistemas clave de la plataforma. Esta referencia se consulta bajo demanda cuando un agente o desarrollador trabaja sobre una funcionalidad específica.

---

## 1. Reels & Social Content Generator
* **Archivos clave:** `server/routes/reels.ts` / `server/services/socialRadarService.ts`
* Scrapea canales de la banda (YouTube, TikTok, Instagram) usando la API de YouTube o `yt-dlp`.
* Filtra fragmentos virales analizando la energía del audio.
* Almacena clips generados en **Supabase Storage**.
* Utiliza el "Tone DNA" persistente y configurable por banda para generar copias alineadas con la identidad de la banda.
* **Render** (`server/services/clipRenderer.ts` + `server/utils/clipFiltros.ts`): el plan de filtros es una función pura (encuadre → subtítulos → hook → loop). Hook de 2,5 s (`hookRotulo.ts`), −14 LUFS, calidad alta y loop opcional con cruce final→inicio (`loopPerfecto.ts`). `clipFiltros.ffmpeg.test.ts` renderiza con el ffmpeg real: `xfade` exige frame rate constante y `acrossfade` no emite audio con dos ramas de un mismo `asplit`.
* **Publicación** (`server/services/socialPublisher.ts`): solo Instagram Reels es real (Graph API, token de la propia banda); nunca se marca `publicado` sin el id de la plataforma. El worker corre cada 60 s, reclama cada post con un UPDATE atómico y solo publica lo `aprobado`/`en_cola` con `auto_publish` activo, interpretando fecha y hora en la zona de la banda. El resto se explica y queda para publicación asistida.
* **Copy** (`server/services/copyPerfecto.ts` + `server/utils/auditoriaCopyReel.ts`, ruta en `server/routes/reelsTexto.ts`): `auditarCopyReel` comprueba sin IA límites por plataforma, hashtags, cebo de engagement, clichés y palabras de IA (une las dos listas `BANNED_AI_WORDS` del repo); su set dorado vive en `server/utils/__tests__/fixtures/copyReelDorado.ts`. `perfeccionarCopy` genera 5 candidatos, descarta los no aptos y un juez con rúbrica ordena el resto; el copy actual de la banda compite también.
* **Métricas y aprendizaje** (`server/services/metricasReels.ts` + `server/utils/aprendizajeReels.ts`): worker cada 15 min que mide cada Reel publicado en Instagram a 1/24/72/168 h (solo la medición más reciente que toque) con el token de su banda y guarda en `reel_metricas` (null = Meta no lo dio). KPI estrella: rewatch = tiempo medio visto / duración. Recomendación de formato por Thompson sampling (Beta-Bernoulli, éxito = rewatch ≥ 1, explora con <3 reels); se inyecta en el prompt del análisis y en el selector de duración. Arranque conjunto con el publicador en `server/services/workersReels.ts`.
* **Montaje al beat** (`server/utils/rejillaBeats.ts`, `analizarTramo` en `server/services/clipNovedades.ts`): con onsets y BPM de `audioKey.ts` se coloca una rejilla de pulsos (fase por proximidad a los onsets) y compases cada 4. El flash del beat-drop cae solo ahí (`eval=frame` imprescindible) y el final del loop se encaja en el pulso más cercano. Sin tempo detectable no hay flash.
* **Control de calidad** (`server/services/controlCalidad.ts` + `server/utils/controlCalidadClip.ts`): tras renderizar y antes de subir, una pasada de ffmpeg mide negro, imagen congelada, silencio, sonoridad, formato y pista de audio. Los bloqueantes (sin audio, negro ≥1 s, congelado ≥3 s, formato, duración, hook pedido y no quemado, volumen desviado >2 LU) impiden la autopublicación; los avisos solo se muestran. Un informe `null` (no se pudo medir) tampoco autopublica. Se guarda en `reel_clips.control_calidad`.
* **Derechos** (`utils/derechosClip.ts`, tabla `reel_clips`): un clip solo se autopublica si el canal de origen es de la banda o la banda declara que tiene los derechos.

---

## 2. AI Music & Sound Studio
* **Archivos clave:** `server/routes/ai_music.ts` / `src/utils/instrumentSynth.ts`
* Genera pistas de acompañamiento y jingles utilizando modelos de Gemini (Lyria).
* Genera bases rítmicas y sintetiza instrumentos (guitarra, violín, handpan, percusión) con `tone.js`.
* Valida y repara notas generadas por la IA antes de la síntesis para evitar distorsiones de audio.
* Exporta conceptos musicales a formato MIDI (`src/utils/midiExport.ts`).

---

## 3. Campañas de Booking
* **Archivos clave:** `server/routes/campaigns.ts`
* Gestión de campañas masivas segmentadas con scoping estricto por `band_id` resuelto en sesión.

---

## 4. Gestión de Ensayos
* **Archivos clave:** endpoints en `server/routes/concerts.ts`, capa de datos en `server/db/rehearsals.ts`, `src/components/ensayos/`
* Orden del día, cronómetro de bloque, grabación/acta, modo local en vivo.
* Cálculo de duración total, detección de cues de audio para precisar transiciones.
* Integración con repertorio para vincular canciones a ensayos y extraer métricas de desempeño.

---

## 5. Transiciones de Canciones & Compatibility
* **Archivos clave:** `src/utils/transitionAudioEngine.ts`, `src/utils/setlistCompatibility.ts`
* Motor de síntesis de transiciones entre canciones usando `tone.js` y análisis de key/energía.
* Validación de compatibilidad de tonalidad/BPM/energía entre temas adyacentes en un setlist.
* Generación de pistas de transición con efectos de síntesis personalizables.

---

## 6. Audio Analysis & Cues
* **Archivos clave:** `server/utils/audioKey.ts`, `src/utils/audioCueDetector.ts`
* Detección automática de tonalidad, onset density, BPM, energía del audio.
* Identificación de cues de audio (cambios rítmicos, puntos de entrada de voces) para timing de ensayos.
* Energía percibida para ordenar canciones en setlists y evitar picos innecesarios.

---

## 7. Deduplicación de Leads
* **Archivos clave:** `src/utils/duplicateLeads.ts`, `src/components/booking/LeadDuplicatesModal.tsx`
* Fuzzy matching de salas/festivales contra la base de datos existente para evitar leads duplicados.
* Scoring de similitud (bigrams, concatenación, distancia de edición).
* UI modal para resolver duplicados antes de crear leads nuevos.

---

## 8. Migración Concierto → Álbum
* **Archivos clave:** `server/routes/concert_to_album.ts`
* Procesamiento de grabaciones en vivo (descarga de YouTube, conversión, análisis).
* Aislamiento automático de stems y pistas individuales.
* Generación de metadatos (duración, cues, energía) a partir de la grabación.

---

## 9. Enriquecimiento de Covers
* **Archivos clave:** `server/utils/enrichCoversWithoutAudio.ts`
* Mapeo automático de covers a los originals (búsqueda de metadatos, scoring de similitud).
* Extracción de tonalidad/BPM de originals cuando el audio de la banda no está disponible.
* Generación de links de referencia para estudio.

---

## 10. Facturación y Ledger de IA
* **Archivos clave:** `server/routes/billing.ts`, `server/routes/donations.ts`, `server/db/aiLedger.ts`
* Checkout y webhooks de Stripe (cambios de plan, suscripciones), donaciones (Ko-fi) y el ledger de consumo de IA por banda.
* Junto con el aislamiento por `band_id` (§2.1), es la única área con excepción obligatoria de TDD (test del caso límite antes que el código) — ver §5.3.1.
* `dbGetAiDebtCents` hace fallback silencioso a tabla directa si la RPC falla, en lugar de rechazar — invariante: nunca rechaza, nunca devuelve NaN/undefined.

---

## 11. Impresión de Repertorios
* **Archivos clave:** `src/components/repertorio/PdfExportModal.tsx`, `src/utils/setlistPaginator.ts`, `src/utils/setlistNoteText.ts`, `src/utils/printSettings.ts`
* `buildPrintDocument` genera UN solo HTML por músico y lo consumen la ventana de impresión y la vista previa (iframe A4 con `sandbox="allow-scripts"`). No reintroduzcas una maqueta de preview aparte: ya hubo una y divergía de lo impreso.
* `setlistPaginator.ts` (función pura, con tests) decide nº de hojas, letra, columnas (1 o 2) y cortes: reparto equilibrado por ITEMS (canciones, bloques e interludios), nunca un encabezado de bloque colgando al final de una hoja, misma letra en todas las hojas y un 10 % de aire repartido entre filas. El usuario puede imponer 1-3 hojas (`forcedPages`); entonces la letra baja hasta donde haga falta y el modal avisa si queda por debajo de 17 pt.
* **Texto limpio antes de imprimir (`src/utils/setlistNoteText.ts`):** se quitan el historial de edición pegado a las notas ("15:56 EDITADA 2 veces"), la nota general autogenerada "Versión Original: …" (duplica los badges de tono/BPM) y los paréntesis repetidos del nombre del setlist. Cada nota lleva su propio tamaño (`textFit.ts`). Los títulos nunca se truncan con "…": si no caben, bajan a dos líneas.
* **Columnas en automático:** el motor prueba 1 y 2 columnas y elige 2 solo con ≥14 temas y si ahorran hojas con letra legible o dan ≥3 pt más con las mismas hojas.
* **Medir con las fuentes ya cargadas:** una web font no se descarga hasta que algo la usa y `document.fonts.ready` resuelve antes. `ensurePrintFonts` pide cada cara con `fonts.load`.
* **Regla CSS de altura:** Toda regla CSS que cambie la altura de una fila debe colgar de la clase de su propio contenedor (`is-centered`, `in-columns`), no de un ancestro.
* **Ajustes recordados por banda (`band_print_settings`, `GET/PUT /api/bands/print-settings`):** alineación, columnas, notas generales, badges, logo, marca de agua y tinta, y qué temas llevan tono/BPM por músico (`badgesScope` + `markedSongs`). Entrada del músico: botón "Me da dudas" (icono ?) en cada tema del setlist (`RepertorioSetlists.tsx`). En el impreso, el QR y la marca van solo en la última hoja de cada copia. Cubierto por `e2e/setlist-mis-dudas.spec.ts` y `e2e/setlist-ajustes.spec.ts`.
* **Pie con QR:** pie de 11 mm generado como SVG síncrono por `src/utils/qrSvg.ts`.
* **Escapado HTML:** Todo texto de banda interpolado en el HTML pasa por `escapeHtml`; lo vigila `src/components/repertorio/__tests__/pdfExportHtmlEscaping.test.ts`.

---

## 12. Choques de Calendario
* **Archivos clave:** `src/utils/calendarConflicts.ts`, `server/services/calendarConflictService.ts`, `src/utils/viajeEstimado.ts`
* Un único detector puro, compartido por cliente (banner en `CalendarView`) y servidor (email). Exige una PERSONA en los dos sitios a la vez: misma banda = intersección de convocados; bandas distintas = solo los músicos que están en ambas. Solape de horas = `choque`; mismo día sin horas o margen corto = `aviso`.
* **Viabilidad de desplazamiento (`src/utils/viajeEstimado.ts`):** tabla de ciudades + fórmula determinista (sin red ni IA). Margen menor que viaje estimado = `choque` (`viaje_inviable`); sin 45 min para montar = `aviso` (`viaje_justo`); sin horas y ≥3 h de viaje = `aviso` (`distancia_dia`).
* **Email solo por `choque`:** una vez por persona y huella (`calendar_conflict_notifications`), programado 20 s tras guardar evento con barrido diario (`CALENDAR_CONFLICT_SWEEP_MS`).
* **Dónde se ve:** banner del calendario, triángulo en el día (mes y semana) y sección «Choque/Aviso» arriba del Resumen de la ficha del evento (`CalendarEventConflicts`, texto de `describirDesdeEvento`). Los textos añaden la ciudad si el título no la trae.
* **Aislamiento multi-tenancy (§2.1):** el músico en dos bandas ve ambos eventos; el líder de una solo ve "otro compromiso en otra banda". La redacción se hace en el DATO (`redactarChoque`), cubierto por tests (`calendarConflicts.test.ts`, `calendarConflictService.test.ts`).

---

## 13. Promoción y Atribución
* **Archivos clave:** `server/routes/enlacesCortos.ts`, `server/utils/enlacesCortos.ts`, `server/db/enlacesCortos.ts`, `server/routes/paginaConcierto.ts`, `src/utils/campanaConcierto.ts`, `src/utils/roiBanda.ts`, `server/routes/referidos.ts`
* **Enlaces cortos (`/r/:code`):** apunta a un destino lógico (`entradas`, `concierto`, `epk`, `fans`), nunca a una URL libre. Resuelto por el servidor (`resolverDestino`). Sin IP guardada: visitante es un hash diario (`hashVisitante`), bots ignorados. Tope de 300 enlaces por banda con rate limit.
* **Publicabilidad:** evento privado (`tipo === 'privado'`) o sin confirmar (`is_posible`) nunca se publica por ninguna vía (`esConciertoPublicable` en `server/utils/paginaConcierto.ts`).
* **Página pública de concierto (`/e/:slug`, `/sitemap.xml`, `/robots.txt`):** HTML server-side con schema.org y Open Graph. Sanitización con `escapeHtml` y lista blanca `DatosPaginaConcierto`.
* **Campaña de cuenta atrás (`src/utils/campanaConcierto.ts`):** 4 hitos (anuncio, recordatorio, última llamada, día D) con variantes estáticas o IA saneada (`sanearVarianteIA`). Borradores sujetos a aprobación humana (§3).
* **ROI (`src/utils/roiBanda.ts`, `RoiBandaWidget`):** Conservador: solo ingresos cobrados frente al coste del plan (`precioMensualPlan`).
* **Insignia y referidos:** Insignia solo en planes gratuitos (`debeMostrarInsignia`). Atribución de referidos en `server/routes/referidos.ts` con protección de doble registro.
* **Cartelería (`/api/cartel/*`, vista `carteleria`):** motor puro en `src/utils/cartel/` (`layout.ts` posiciona por proporciones del ancho, `contraste.ts`, `datos.ts`, `config.ts`; `render.ts` es la única pieza con canvas), UI en `src/components/cartel/`, servidor en `server/routes/cartelria.ts` (montado desde `campanaConcierto.ts` para no inflar `server.ts`). **Fondo de IA:** `server/services/imagenCartel.ts` pide `CARTEL_VARIANTES` (3 por defecto) ilustraciones 4:3 en paralelo a `CARTEL_MODELO_IMAGEN` (Gemini 3 Pro Image; si no está disponible cae a `gemini-2.5-flash-image`) y `juezCartel.ts` (visión) elige la mejor; solo esa se sube. Cada imagen apunta su coste en el ledger. **Retocar** (`POST /api/cartel/retocar`, `retocarFondoCartel`): una sola imagen nueva a partir del fondo actual y una instrucción de la persona; la imagen se lee SIEMPRE del historial de fondos de ese bolo (nunca una URL del cuerpo), la instrucción va saneada y entre etiquetas como dato, y si el fondo lleva letras el prompt las fija y el juez las vuelve a leer (`textoOk`). Cada retoque es una versión más del historial (`MAX_FONDOS_IA` = 8), así que volver atrás es elegir la miniatura anterior. Si la IA falla una letra al generar con letras, el cliente ofrece «Repetir con el texto exacto» (un clic, otra tanda). **QR en Feed e Historia:** ajuste `qrDigital` (apagado por defecto; en digital el QR mide 170 px y en el impreso 230) y el prompt reserva el 22 % inferior sin letras. **Plantillas de autor como RESPALDO** (`plantillas.ts`, fondo `{ tipo: 'plantilla', id }`; no están en la fila de fondos: solo se ofrecen en el panel «Carteles de autor» cuando la IA falla al pintar o ya hay una elegida): seis carteles ilustrados por código, sin IA y sin coste (sol retro, círculos tipo risografía, montañas, vinilo, arcos y retícula de puntos), cada uno con su paleta cerrada. Se pintan a sangre como una ilustración vertical (mismo texto encima, misma fibra), con el motivo compuesto en una caja de ≤ 1,2 veces el ancho y alineado arriba (en el A4 y la historia el motivo no baja al bloque de texto). Sobre papel claro el texto va en la tinta oscura de la plantilla y sin velo; sobre fondo oscuro, claro. Son deterministas por la semilla del bolo. **Muestras reales:** `npm run cartel:muestras -- [n] [estilo] [--sin-letras]` genera carteles con el mismo prompt, modelo y juez que la app (necesita `GEMINI_API_KEY`; gasta imágenes de verdad) y deja los PNG en `tmp/cartel-muestras/`. **Imprenta:** `sangrado.ts` prolonga el A4 3 mm repitiendo el borde y dibuja ocho marcas de corte (Descargar para imprenta, solo en «Imprimir A4»). **Autoguardado:** `reintentar.ts` repite el `PUT /config` (2 s, 5 s, 10 s); el aviso global lo ignora y el editor avisa solo si tampoco así se pudo. Bajar el gasto: `CARTEL_VARIANTES=1` y/o `CARTEL_MODELO_IMAGEN=gemini-2.5-flash-image`.
  * **Cartel instantáneo sin IA:** paleta + la Onda; la foto propia (reescalada a JPEG ≤ 1600 px) y el fondo de IA son extras. La IA pinta SOLO el fondo, en 9:16, y sirve para los tres formatos (feed 1080×1350, historia 1080×1920 con franjas seguras de Instagram, A4 2480×3508). El texto real lo compone el cliente: los modelos de imagen escriben mal.
  * **Contraste garantizado:** se mide la luz del fondo por percentiles (p10/p90) en cada zona de texto y se calcula el velo exacto para 4,5:1 en el peor píxel (`decidirTinta`, con test de barrido).
  * **QR solo en el impreso:** enlace corto canal `cartel` → página del bolo, reutilizado (sus escaneos cuentan en la campaña). Se codifica en mayúsculas para entrar en modo alfanumérico (`urlParaQr`).
  * **Marca «Hecho con BandManager.io»:** en todos los planes; solo los de pago pueden quitarla (`puedeQuitarMarcaCartel`, misma lista que `esPlanGratuito`, con test que los ata).
  * **Bolo compartido:** lineup = banda + `bandas_compartidas`; la cabeza de cartel se pregunta (nunca se adivina) y se guarda por bolo.
  * **Persistencia:** `concerts.cartel_config` (jsonb, saneado con `sanearConfigCartel` en cliente y servidor; URLs solo de `carteles/{bandId}/` vía `esUrlDeCartel`) y `concerts.cartel_url` = el PNG de feed al compartir/descargar, que usan la página `/e/:slug` y su Open Graph. **Solo** `dbGuardarCartel` escribe esas dos columnas: `dbUpsertConcert` las ignora a propósito (test en `concertsGastosDetalleMerge.test.ts`).
  * **Estado en la app:** los bolos se cargan una sola vez, así que lo ya guardado se refleja en memoria con `handleCartelGuardado` (solo local, sin red; `conCartelGuardado` en `src/utils/cartel/estado.ts`). Sin eso, al salir de la vista y volver se olvidaban las elecciones hasta recargar. Lo cubre `e2e/carteleria.spec.ts` (se comprobó que falla sin el arreglo). Correrlo: `PLAYWRIGHT_CHROMIUM_EXECUTABLE=… E2E_BASE_URL=http://localhost:3000 npx playwright test e2e/carteleria.spec.ts`.
  * **ADN visual de la banda** (`/api/cartel/adn`, `/api/cartel/referencias`; tabla `band_cartel_estilo`, saneador compartido `src/utils/cartel/adn.ts`; hook `useAdnCartel`): hace que el cartel se parezca a la banda.
    * **Automático:** «Tus colores» (paleta del logo, `paleta.ts`, con contraste garantizado y sin guardar), estilo de arranque por favoritos > plantilla del EPK > género (`estiloSugerido`), bio/tono al prompt y logo opcional sobre una placa clara.
    * **Referencias (≤ 3):** subidas (JPEG reescalado en el cliente, en `carteles/{bandId}/ref/`) o carteles anteriores de la propia banda. Es OPCIONAL. Las lee el SERVIDOR de la BD y de su propia carpeta (`cargarReferencias` → `rutaDeUrlCartel` + `descargarDeAlmacenamiento`, firma JPEG/PNG comprobada); el cliente nunca decide qué ficheros se leen. Se pasan a Gemini como imágenes junto al prompt.
    * **Favoritos (≤ 6):** el fondo de IA que la banda comparte o descarga. Se reutilizan gratis en otros bolos, fijan el estilo preferido y rellenan las referencias si `aprender` está activo.
  * **Contra el aspecto de IA** (skill `cartel-direccion-de-arte`): `DIRECCION_DE_ARTE` en `promptCartel.ts` (estilos descritos con oficio, lista de «lo que delata a una IA», vetados los adjetivos de serie, con test), grano de papel determinista sobre los fondos de IA (`grano.ts`) y tipografía/layout propios. Reduce el aspecto de IA, no lo garantiza. No se oculta ni quita la marca de procedencia del proveedor.
  * **Placas de papel y ventana** (`placas.ts`, `ventana.ts`): sobre un fondo de IA el cartel es papel con dos bandas lisas (nombre arriba, datos abajo), filete y orla, y la ilustración va ENTERA en la ventana entre ellas (`encajarImagen`: cover si recorta ≤ 30 %, si no entera y centrada). El modelo dibuja una ilustración apaisada 4:3 (`RELACION_FONDO`), no un cartel vertical con huecos; con ilustración el nombre es más pequeño (`compacto` en el layout). El prompt veta el emblema, los rayos radiales y los iconos de relleno.
  * **Encuadre a sangre** (`encuadre: 'sangre'`, por defecto desde el cliente): el modelo dibuja una ilustración VERTICAL 3:4 que ocupa todo el cartel, con el motivo en la franja central y arriba/abajo zonas calmadas y oscuras. `render.ts` la detecta por proporción (alto/ancho ≥ 1,1), la pinta como foto a sangre y pone el texto ENCIMA: siempre en tinta clara sobre una sombra de la propia imagen (nunca letra oscura sobre velo de papel). Con la letra y la composición en «Automático», a sangre el render elige letra de cartel (Anton) y la composición «base» (datos pequeños arriba, nombre enorme abajo, sin filetes); el velo es largo, con curva suave y del color medio de la propia imagen. **Letras dibujadas por la IA** (`conTexto`, por defecto activado en el cliente y solo con una banda): el servidor arma los textos EXACTOS (nombre en mayúsculas, fecha, sala · ciudad) desde el bolo y la banda de la sesión —nunca del cuerpo de la petición— y el prompt pide dibujarlos integrados en el arte con una zona segura (8 % de márgenes y el 16 % inferior vacío). `juezCartel.ts` además LEE las letras de cada variante y prefiere la que está bien escrita; si ninguna lo está, la respuesta trae `textoOk: false` y el cliente lo avisa. El fichero se guarda como `ia-t-…png` (`fondoIa.ts`): el cliente lo detecta, no pinta su propio texto ni velo (`dibujarArteEntero`: sin recorte, relleno con la propia imagen desenfocada) y solo coloca QR, pie y logos, más la hora y la dirección (si están activadas en Ajustes) como líneas extra apiladas en la franja inferior libre; en ese modo la tinta se decide por la mediana del fondo (las letras claras de la IA cercanas no deben engañar la medición). La dirección (`direccion` en `CartelConfig`, apagada por defecto) sale del bolo y se pinta también en las composiciones normales (bloque propio, y en la columna derecha de «base»). Las ilustraciones apaisadas antiguas siguen usando la ventana. Riesgo conocido: si el modelo ignora las zonas calmadas, el velo del 60 % garantiza la lectura a costa de oscurecer esa parte.
  * **Papel, tinta y letra del arte** (`papel.ts`, `voces.ts`): `analizarArte` lee el papel del borde de la ilustración (si es liso, el cartel es de ese papel y la ilustración se funde con él, `modo: 'fundido'`; si no, se enmarca) y su tinta dominante (el texto se escribe en ella, ≥ 7:1). La «letra» del nombre y del día es una de tres voces (moderna/Onest, cartel/Anton, clásica/DM Serif Display; `cartel_config.letra`, `auto` la saca del estilo de la banda); la fecha lleva el día enorme y el mes y el año a su lado; con ilustración el nombre va en una línea ancha si cabe. El nombre y el día llevan desregistro con la segunda tinta del arte (`tinta2`); la ilustración fundida sube y solapa el final del nombre con mezcla `darken`; las versalitas pequeñas llevan espaciado. La fibra de papel se pasa por encima de fondo y letras (no del QR).
  * **Composiciones** (`composiciones.ts`, `layoutBase.ts`, `voces.ts#resolverComposicion`; `cartel_config.composicion`): ventana (nombre arriba, datos abajo), centrada (simétrica con filetes y rombo: `Adorno`) y base (nombre enorme abajo y la fecha arriba). `auto` la decide la letra; la ilustración fundida solapa el nombre por arriba (ventana, centrada) o por abajo (base). Layout puro; `composiciones.test.ts` comprueba en las tres que nada se sale ni se pisa, con QR, logos, bolo compartido y nombres largos.
  * **La idea de la persona** (`POST /api/cartel/idea`, `DELETE /api/cartel/idea`, `POST /api/cartel/brief`; `idea.ts`, `briefCartel.ts`, hook `useIdeaCartel`, panel `IdeaCartel`): cinco campos cortos opcionales y un boceto JPEG (un solo fichero por banda en `carteles/{bandId}/idea/idea.jpg`). El servidor traduce y ordena el texto al inglés con una llamada de texto (se apunta en el ledger de la banda), lo mete en el prompt como datos etiquetados tras las reglas y manda el boceto a la imagen como guía de composición. Sin IA de texto se usa lo escrito, saneado. El cliente nunca elige qué fichero se lee.
  * **Logos de las bandas** (`POST/DELETE /api/cartel/:concertId/logo`; `logos.ts`, `layout.ts#filaDeLogos`): el de la banda y hasta 4 subidos para el bolo (PNG ≤ 1024 px, en `carteles/{bandId}/{concertId}-logo-*.png`; `cartel_config.logos`). Se pintan como siluetas de la tinta del texto con desgaste determinista, en una fila encima de los datos, con peso óptico parecido (superficie constante). Borrar solo borra un logo que el bolo tiene en su configuración.
  * **Contraste medido sobre el texto, línea a línea** (`tintaDeLineas`, cola del 3 %): medir la zona entera no detectaba una mancha oscura detrás de una sola palabra.
  * **Seguridad:** todo acotado con `getTargetBandId` + `dbGetConcertDeBanda`; bolos privados o sin confirmar no gastan IA ni publican cartel (409); el PNG final se valida por firma y por medidas exactas de un formato; coste fijo por imagen en `aiLedger`; `imagenRateLimiter` (6/5 min).
