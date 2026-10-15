# Subsistemas Especializados — BandManager.io

Documentación técnica y operativa de los 13 subsistemas clave de la plataforma. Esta referencia se consulta bajo demanda cuando un agente o desarrollador trabaja sobre una funcionalidad específica.

---

## 1. Reels & Social Content Generator
* **Archivos clave:** `server/routes/reels.ts` / `server/services/socialRadarService.ts`
* Scrapea canales de la banda (YouTube, TikTok, Instagram) usando la API de YouTube o `yt-dlp`.
* Filtra fragmentos virales analizando la energía del audio.
* Almacena clips generados en **Supabase Storage**.
* Utiliza el "Tone DNA" persistente y configurable por banda para generar copias alineadas con la identidad de la banda.

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
* **Cartelería (`/api/cartel/*`, vista `carteleria`):** motor puro en `src/utils/cartel/` (`layout.ts` posiciona por proporciones del ancho, `contraste.ts`, `datos.ts`, `config.ts`; `render.ts` es la única pieza con canvas), UI en `src/components/cartel/`, servidor en `server/routes/cartelria.ts` (montado desde `campanaConcierto.ts` para no inflar `server.ts`).
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
  * **Contraste medido sobre el texto, línea a línea** (`tintaDeLineas`, cola del 3 %): medir la zona entera no detectaba una mancha oscura detrás de una sola palabra.
  * **Seguridad:** todo acotado con `getTargetBandId` + `dbGetConcertDeBanda`; bolos privados o sin confirmar no gastan IA ni publican cartel (409); el PNG final se valida por firma y por medidas exactas de un formato; coste fijo por imagen en `aiLedger`; `imagenRateLimiter` (6/5 min).
