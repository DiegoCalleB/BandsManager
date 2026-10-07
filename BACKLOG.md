# 📋 BACKLOG.md — Ideas y Tareas Pendientes

> Backlog de producto: ideas, mejoras y features pendientes de evaluar o construir.
> Para directivas técnicas/arquitectura obligatorias, ver `AGENTS.md`.
> Para riesgos legales detectados, ver `AGENTS.md` §8.

Formato de cada entrada: **qué es**, **por qué importa** (impacto real, no "estaría bien"), y **estado**.

---

## ⏸️ Aplazado: billing de planes (auditoría B, 2026-10-06)

* **Qué:** arreglos de `server/routes/billing.ts` que NO se han hecho porque los planes están desactivados (todos los usuarios nuevos entran en modo promo y no pueden cambiar de plan):
  1. Los `UPDATE` a `registered_bands` / `users` (plan, créditos, estado) no comprueban `{ error }`: un cobro puede quedarse sin plan.
  2. Idempotencia de planes: repetir un `confirm-success` o `customer.subscription.updated` resetea créditos o reactiva un plan cancelado.
  3. Pasar a «Ensayo» no cancela la suscripción en Stripe; se puede abrir una segunda suscripción sin cancelar la anterior.
  4. El plan se deriva de `subscription.metadata.planId` (no cambia si se cambia de precio en el portal) y las bajadas entre planes de pago no se programan.
  5. Los créditos de IA solo se descuentan desde el cliente (`/billing/consume-credits`); las rutas de IA no los comprueban en el servidor. Decisión pendiente: ¿todas las rutas o solo las caras (stems, reels, análisis)?
* **Por qué importa:** son dinero real en cuanto se reactiven los planes; hoy el riesgo es bajo porque nadie los usa.
* **Hecho ya:** `plan` en `PUT /users/:id` solo para admin (PR 98); webhook fiable para el apoyo voluntario (500 si falla, reintento de Stripe no descartado).
* **Estado:** pendiente, a retomar ANTES de reactivar los planes.

---

## 🏛️ Planes Maestros de Arquitectura, IA y Negocio (Listos para Implementación)

### 1. Sistema Operativo de Management Digital 360° & Definición de Buyer Personas
* **Qué:** Unificación de las 5 figuras clásicas del equipo de un artista (Booker, Tour Manager, Director Musical de Ensayos, Contable/CFO y Community Manager) en una plataforma asistida por IA para 5 perfiles clave:
  1. *El Líder Multitarea (Banda DIY)*: Prospección de salas con Agentes IA, pitches personalizados y finanzas de carretera.
  2. *La Solista / Artista Emergente*: Generador de Reels virales con Tone DNA y EPK interactivo de alto impacto.
  3. *El Músico de Sesión / Multi-Banda (Mercenario del Directo)*: Selector instantáneo multi-banda en cabecera, calendario unificado sin solapes de fechas, notas técnicas por instrumento en canciones (`src/components/ensayos/`) y control de cachés personales por bolo.
  4. *El Manager / Booker Boutique (3 a 8 bandas)*: Control multi-inquilino de múltiples agrupaciones y campañas masivas segmentadas.
  5. *El Programador de Sala (Facilitador B2B)*: Dossier en 1 clic (EPK sin adjuntos pesados), rider verificado y firma de acuerdo desde el móvil en 30 segundos.
* **Por qué importa:** Posiciona a BandManager.io no como un simple CRM de bolos, sino como el sistema operativo integral e indispensable para cualquier profesional de la música en directo.
* **Estado:** Especificado y validado conceptualmente.

### 2. Módulo de Contratos Digitales, Reserva de Bolos y Custodia (Estilo Airbnb / Escrow Universal)
* **Qué:** Formalización de acuerdos de concierto con enlace público 1-Click (`/deal/:token` o `/contract/:token`) que cubre el 100% de los casos de la industria musical sin fricción:
  1. *Los 4 Modelos Económicos:* Caché Fijo, Taquilla Compartida (Door-Split), Garantía Mínima vs Taquilla y Alquiler de Sala.
  2. *Los 3 Métodos de Liquidación (Neutros y Libres de Fricción Fiscal):*
     - **100% Digital con Custodia (Stripe Escrow):** Retención de señal/total y liberación post-concierto con take-rate para la plataforma.
     - **Liquidación Directa entre Partes:** *Hoja de Coordinación Técnica y Condiciones de Producción* (sin pasarela obligatoria, lenguaje neutro que protege horarios, rider, comidas y liquidación en sala).
     - **Híbrido:** Pequeña señal digital de fianza de viaje por Stripe (ej. 100-150€) para garantizar el compromiso de furgoneta + resto liquidado en sala.
  3. *Políticas de Cancelación Claras:* Flexible (hasta 15 días), Moderada (50% con <10 días para gastos de viaje), Estricta (100% con <72h) y Cláusula de Fuerza Mayor.
  4. *Firma Táctil Móvil:* Canvas de firma manuscrita para el programador de la sala sin necesidad de registro ni descargas de apps.
* **Por qué importa:** Elimina el pánico al plantón y al impago para las bandas, profesionaliza la relación con la sala y abre una vía de monetización masiva mediante Booking Fees y Take-Rate.
* **Documentos relacionados:** `docs/planes/plan_anti_fraude.md`
* **Estado:** Especificado. Listo para crear tabla `booking_deals`, endpoints `/api/contracts` bajo `getTargetBandId` y vista pública responsive.

### 3. Motor de Crecimiento Viral y Automatización de Redes con ManyChat (Doble Nivel)
* **Qué:** Integración de automatizaciones en Instagram DMs, TikTok y WhatsApp a dos niveles:
  1. *Nivel Plataforma (@bandmanager.io):* Embudos automáticos en Reels ("Comenta SALAS / RIDER / CONTRATO") para captar miles de músicos y crearles cuentas gratuitas en BandManager.
  2. *Nivel Banda (Integrado en Dashboard / Fans):*
     - Bucle "De Reel a Entrada Vendida": la IA redacta el post con CTA ("Comenta DIRECTO para 20% dto"), ManyChat envía la entrada por DM al instante y el fan queda registrado en el CRM de Fans (`fans`) etiquetado por ciudad.
     - Auto-respuesta a Salas por DM: Si un promotor escribe por Instagram, se le envía el EPK interactivo y se crea automáticamente un Lead en el CRM de Booking.
* **Por qué importa:** Multiplica el alcance orgánico de los Reels de las bandas en el algoritmo de Instagram (al disparar comentarios) y automatiza la venta de entradas y captación de datos de fans sin trabajo manual.
* **Estado:** Especificado. Arquitectura de Webhook `POST /api/webhooks/manychat` y componentes de configuración de embudos listos para diseño.

### 4. Motor de SEO Programático y Adquisición Orgánica (Sin WordPress)
* **Qué:** Infraestructura de captación de tráfico orgánico en Google integrada directamente en la aplicación:
  1. *Directorio Público de Salas por Ciudad (`/salas/:ciudad`):* Páginas indexables optimizadas para búsquedas de alta intención (*"Salas para tocar en Madrid"*, *"Dónde enviar dossier en Barcelona"*), con llamada a la acción para probar BandManager.
  2. *Herramientas Gancho Públicas (Lead Magnets):* Calculadora pública de caché y gastos de gira + Generador rápido de rider técnico interactivo con exportación en PDF.
  3. *Metadata Estructurada (Schema.org, JSON-LD, OpenGraph):* Marcado enriquecido para eventos, salas y fichas de artistas para dominar las SERPs de Google.
* **Por qué importa:** Genera un flujo constante y gratuito de nuevas bandas y salas hacia la plataforma sin necesidad de mantener un blog externo en WordPress ni pagar campañas de publicidad caras.
* **Estado:** Diseñado. Listo para montar las rutas públicas dinámicas y componentes de captación.

### 5. Plan Maestro Defensivo, Acuerdos 1-Click y Directo (`docs/planes/plan_anti_fraude.md`)
* **Qué:** Sistema completo de cierre de conciertos sin fricción con enlace público 1-Click (`/deal/view/:token`), firma electrónica simple válida bajo Reglamento eIDAS (UE 910/2014) con hash SHA-256 inmutable, minimización estricta de datos RGPD, detección de atribución CRM sin espionaje (el *Nudge Elegante* de reactivación) y las 6 innovaciones agénticas de directo:
  1. *WhatsApp Magic Share* para técnico de sonido (ficha de cabina live) y portero (lista de puerta táctil).
  2. *Modo Escenario Offline* con Service Workers e IndexedDB a prueba de sótanos sin cobertura.
  3. *Dynamic Touring Yield Management* (optimización de rutas y relleno de fechas huérfanas con caché dinámico).
  4. *Tech Rider Auto-Adaptativo ("Self-Healing Rider")* con visión artificial y equivalencias de inventario de sala.
  5. *Director de Concierto en Vivo* con ajuste dinámico del Setlist por compatibilidad tonal y toque de queda.
  6. *Smart Settlement Post-Show* integrado con BandSplit.
* **Por qué importa:** Resuelve el problema del "bypass" del CRM mediante incentivos de valor real en vez de sanciones policiales, protege legal y fiscalmente a las bandas y salas, y posiciona a la plataforma como la más avanzada del mundo en tecnología de directo.
* **Documento maestro:** `docs/planes/plan_anti_fraude.md`
* **Estado:** Especificado y validado en arquitectura. Listo para implementar P0 (Esquema SQL + Endpoints `/api/deals` bajo `getTargetBandId` + Vista Web Responsive 1-Click).

### 6. Plan Económico y Técnico de IA (`docs/planes/plan_gestion_tokens_ia.md`)
* **Qué:** Modelo híbrido de dos niveles para el uso de modelos de lenguaje y generación multimedia:
  1. *Texto Ilimitado con Fair Use* (Scout, Redactor, Lector, Contestador, Chat) protegido por una ventana móvil de 5 horas que resetea cuota cada 15 minutos, sin que el usuario sienta barreras artificiales de recarga.
  2. *Cupos de Estudio Multimedia* para tareas pesadas de GPU/CPU (Separación de Stems con Replicate/Iris y Renderizado de Reels con Remotion/FFmpeg), con pases mensuales + acumulador permanente (*Rollover con tope*) y bonificaciones vitalicias por conciertos confirmados (`studio_bonus_stems`, `studio_bonus_reels`).
* **Por qué importa:** Garantiza un margen bruto superior al 98% (coste por usuario activo < 0,15 €/mes), elimina la frustración de la "moneda virtual de créditos" en tareas conversacionales y alinea la economía del SaaS con la rentabilidad empresarial.
* **Documento maestro:** `docs/planes/plan_gestion_tokens_ia.md`
* **Estado:** Especificado y validado económicamente. Listo para aterrizar en `planLimits.ts` y controladores de billing.

### 7. BandSplit / TourCount: El "CFO de Banda con IA" para Gira y Local (`docs/planes/splitband.md`)
* **Qué:** Mucho más que un Splitwise tradicional: el primer Director Financiero de Banda con IA (AI Band CFO) para bolos y vida de local:
  1. *Dualidad Gira vs. Día a Día*: Cubre tanto los gastos del viaje (gasoil, furgoneta, peajes) como la rutina del local de ensayo (Dani compró una pantalla 4x12, Javi compró cuerdas/cables, alquiler mensual del local, camisetas de merch).
  2. *Los 4 Caminos de Compensación*:
     - Vía 1: Reembolso 1-Click desde la Caja Común / Bote de la app si hay fondos.
     - Vía 2: Compensación en el próximo concierto a las 3 AM ("deuda flotante de banda" saldada con el sobre antes de repartir el neto).
     - Vía 3: Escote directo entre miembros con Deep Links a Bizum para gastos mensuales fijos (alquiler de local).
     - Vía 4: Registro de Activos de Banda con reparto de propiedad (% por músico) y amortización justa si alguien se va del grupo.
  3. *Voice-to-Expense & Tax OCR con IA*: Registro en furgoneta por voz, desglose de IVA (10%/21%) y exclusión de gastos personales no deducibles.
  4. *Árbitro Imparcial con "Pacto de Banda"*: Mediador neutral que resuelve discrepancias objetivamente según las reglas acordadas por el grupo.
  5. *Tour CFO Predictivo*: Cálculo en vivo del umbral de rentabilidad de la gira durante el trayecto y kilometraje GPS automático.
* **Por qué importa:** Resuelve la causa número 1 de discusiones y ruptura de bandas (el dinero y las cuentas tanto en gira como en el local), automatiza la contabilidad y protege el patrimonio de los músicos.
* **Documento maestro:** `docs/planes/splitband.md`
* **Estado:** Especificado con arquitectura de IA, modelo de compensación y esquema DDL listos.

---

## 💡 Ideas por explorar

### Subida de vídeo de fans vía QR como gancho de conversión hacia el landing
* **Qué:** en el QR del concierto (cartel, entrada, escenario), añadir la opción de que el asistente suba su propio clip de 15" grabado durante el show.
* **Por qué importa:** el valor principal no es el vídeo en sí — es que **da un motivo activo para escanear el QR** más allá de "mirar el dossier". Alguien que quiere subir su clip entra sí o sí a la landing, y una vez dentro ve el resto: fan landing, EPK/dossier, próximos conciertos. Convierte una acción pasiva (escanear por curiosidad) en una con intención, y de paso aumenta las visitas reales a todo lo demás que ya tenéis montado en esa página (captación de fans, calendario).
* **Relacionado:** `PublicFanCapture.tsx` (ya tiene el patrón de consentimiento RGPD que habría que reutilizar aquí si se guardan los clips), mapa de energía del setlist (para priorizar qué clips destacar si más adelante se monta un reel con ellos).
* **Estado:** idea capturada, sin diseñar. Nota: el "reel editado automáticamente con IA a partir de los clips" es una fase posterior y más compleja — esto de aquí es solo el gancho de entrada al QR, no depende de que exista el editor de IA para tener valor por sí solo.

### Analizador de acordes/armonía real a partir de audio (no texto)
* **Qué:** hoy `SongChordsViewerModal.tsx` trabaja con cifrado escrito a mano o inferido por IA a partir de la letra/estructura (`chordUtils.ts`). La idea es que la IA "escuche" el audio real de la canción y saque la progresión de acordes de verdad, detecte modulaciones y genere un párrafo de análisis armónico ("aquí hay un acorde prestado que no pertenece a la tonalidad, por eso suena así").
* **Por qué importa:** es la única feature que le habla directamente a un perfil analista musical (tipo Shountrack/Rick Beato) — convierte a la app en generadora de su propio contenido de análisis, no solo en herramienta de booking/gestión.
* **Viabilidad (no es trivial, pero tampoco investigación de frontera):**
  * Técnica base: extraer chroma (energía por nota) por compás y comparar contra plantillas de acorde por similitud — MIR clásico, no hace falta deep learning para una v1.
  * **Ventaja real que ya tenemos:** pasar primero por **Iris** (separador de pistas) y analizar el stem de guitarra/piano + bajo por separado, no la mezcla completa — la batería es lo que más rompe la precisión de estos algoritmos, y ya tenemos cómo quitarla de en medio.
  * Librería a evaluar antes de escribir DSP a mano: **`essentia.js`** (WASM, MIT, ya trae detección de acordes integrada) — correría en el backend Node sin reinventar chroma/CQT desde cero.
  * La parte de "explícame por qué funciona" es la fácil: una vez hay secuencia de acordes, es texto generado por Gemini sobre datos estructurados, mismo patrón que el análisis IA del setlist ya existente.
  * **Riesgo de alcance:** acordes complejos (7maj9, sus4, inversiones, jazz) son mucho más difíciles de acertar que triadas simples. MVP recomendado: tónica + mayor/menor por compás (cubre la mayoría de rock/pop/indie), dejar acordes extendidos para una v2.
* **Estado (2026-10-06): HECHO en gran parte con detector propio** (`server/utils/chordDetection.ts`, `pulso.ts`, `refinarFronteras.ts`; ver `docs/chordify-propio.md`): acordes con tiempos, tonalidad y cambios de tono, pulso, compases y bloques, edición manual y evaluación contra las correcciones de la banda. **Corrección importante a lo de arriba: `essentia.js`/Essentia es AGPL, no MIT** (obligaría a abrir el código) y **madmom tiene modelos no comerciales**: ambos descartados para producción. Lo que sigue pendiente de este item es la parte de «explícame por qué funciona»: ver «Profesor de armonía» más abajo.

### Profesor de armonía: colores por función, números romanos, ficha tonal y sugerencias
* **Qué:** que cada canción explique su armonía como un profesor: grado romano de cada acorde (`I, bVII, V7, ii°`), color por función (tónica / subdominante / dominante / modal), modo y cambios de tono, progresiones con nombre, escalas y notas guía por acorde, qué tocar para improvisar o componer riffs y líneas que encajen, e ideas para dar dinamismo al tema.
* **Principio:** los hechos los calcula código determinista (testeable); la IA solo los redacta, con validación posterior y sugerencias etiquetadas como «idea». Sin SQL (caché en `analisis_acordes`).
* **Plan completo y decisiones pendientes:** `docs/plan-armonia-didactica.md` (fases 1-5: motor de teoría y colores → pestaña «Armonía» → profesor con IA → mástil/teclado interactivo y práctica por bloque → calidad con golden tests).
* **Aviso:** el recuadro «Estructura Rápida para el Músico» del visor sale de la ficha del sustituto generada por IA y puede ser inventado; la estructura calculada (bloques A/B) debe sustituirlo.
* **Estado (2026-10-07): fases 1-3 implementadas** (motor de teoría, colores por función y grados, pestaña «Armonía», profesor con IA; ver el final de `docs/plan-armonia-didactica.md`). Pendiente: fase 4 (mástil/teclado iluminado mientras suena, práctica por bloque) y fase 5 (golden tests con canciones reales, botón «esto está mal»). Color por *grado* con 7 tonos descartado: choca con el sistema de diseño.

### Saber cuándo cambiar de acorde, sin mirar arriba (ideas tras el reloj por acorde)
* **Hecho:** reloj que se llena en cada acorde de la letra con aviso en el último 0,8 s y el siguiente acorde iluminado; vibración opcional al cambiar (`RelojEnAcorde.tsx`, `relojAcorde.ts`).
* **Por hacer (de más fácil a más ambicioso):**
  * **Modo escenario:** pantalla gigante con solo el acorde actual y el siguiente, alto contraste, pensada para directo y ensayo.
  * **Cuenta atrás de compás** sobre el acorde («3·2·1·¡cambio!») para entrar en el «1» (ya tenemos pulso y compases).
  * **Bola que rebota** por la letra sílaba a sílaba al pulso (tenemos pulso y tiempos por palabra).
  * **Click o tono suave** antes de cada cambio, solo en auriculares (Web Audio).
  * **Pasar de página con pedal** Bluetooth.
  * **Reloj / gafas:** el cambio de acorde se nota en la muñeca o aparece en unas gafas.
* **Visión 2050 (especulación, no datos):** letra que respira con la voz sílaba a sílaba; **acordes que se adaptan al nivel de cada músico** (simplificados o con extensiones de jazz); **seguimiento del tempo de la banda en vivo** con el micro, para que el cifrado vaya al ritmo de ese ensayo y no del disco (la idea con más futuro y con la que BandManager se diferenciaría de Chordify, que va con la grabación fija); un profesor que te escucha y te corrige.

### Detección de acordes: mejoras pendientes y modelos a comparar
* **Medir antes de cambiar:** `npm run eval:acordes` compara el detector con las correcciones de la banda (verdad persistente en `analisis_acordes.referenciaManual`). Falta corregir 20-30 tramos de 2 canciones reales para tener la primera tabla.
* **Comparar gratis:** `tools/colab/acordes_btc.py` (BTC, ISMIR 2019, MIT) en Google Colab; sin probar (el entorno de desarrollo no puede descargar pesos). Los pesos están entrenados con datasets académicos: revisar licencia antes de producción.
* **Si un modelo gana por números:** worker de GPU bajo demanda (Modal/RunPod) con el modelo ganador + **Beat This!** (MIT) para directos sin claqueta y **All-In-One Music Structure Analyzer** para secciones (verso/estribillo). Coste realista 0,01-0,05 $ por canción contando arranques en frío, no 0,005.
* **Mejoras propias pendientes:** decodificar los acordes **por pulso** en vez de por ventanas fijas de 186 ms; detectar «sin acorde» en intros sin armonía.
* **Letra:** reintentar por tramos los huecos con voz y sin letra (con la voz de Iris y detección de actividad vocal); alineación forzada tipo WhisperX/`lyric-align` para el karaoke (sin medidas fiables sobre voz cantada: probar con canciones reales); botón «reintentar este tramo».
* **Evitar:** madmom (modelos no comerciales), Essentia (AGPL), APIs de pago por minuto. Descartada la promesa de «precisión absoluta»: un detector ronda el 75-85 % en triadas y la corrección manual es parte del producto.

### Deuda de diseño: lo que queda tras las fases F3–F9
* **Qué:** las primitivas (`Input`, `Textarea`, `Select`, `Field`, `Switch`, `Card`, `EmptyState`, `Button`) ya cubren los campos (≈650 migrados; los que quedan llevan `data-raw` con motivo), unas 400 píldoras/alternancias y ≈240 botones de solo icono (`IconButton`, con nombre accesible obligatorio). Los arquetipos de control (botón, icono, enlace, fila de menú, campo, interruptor, chip, tarjeta) ya tienen primitiva y `design-audit` impide escribir otro a mano. Los ~1.100 `<button>` restantes son superficies compuestas (tarjetas pulsables, celdas, pestañas con contenido propio) sin arquetipo repetido.
* **Siguiente paso:** primitivas `Tabs` / `Segmented` (aspecto activo/inactivo único), `MenuItem` (filas de ⋮) y `IconButton` con `aria-label` obligatorio; después un codemod por patrón y pasar `botonSinPrimitiva` de aviso a error en `design-audit`.
* **Revisión con datos reales:** revisado con datos simulados (21 salas, conciertos, fans) en claro y oscuro: Booking, Panel, Fans, Calendario, Management, Agente Mánager, Ensayos y Discografía. Finanzas y Merchandising también revisadas (simulando líder y plan Cabeza de Cartel): títulos al estilo `page-title`, importes con `formatEur`, cifras en tinta (sin verde-sube/rojo-baja). Falta solo verlas con los números reales de Ruta 66.
* **Estado:** F3 a F9 hechas; solo falta contrastar con los números reales de Ruta 66.

### Deuda: datos de bandas concretas (Bakandeya, Ruta 66, Master of Prompts…) todavía en código
* **Qué:** auditoría de octubre 2026. Ya limpiado (fase 1): pitches y firmas de BandCRM, asunto del Chatbot, redes de ejemplo en FansLanding, logos y nombres por defecto y hoja de ruta / material de ejemplo del Calendario, texto del rider en Booking, líneas inventadas del dossier PDF, géneros por defecto (“Balkan Ska”) y etiqueta “Balkan Hype”.
* **Hecho en fase 1b/2 (parcial, octubre 2026):** fuera el texto de Bakandeya de las rutas de lectura y prompts del servidor (`emailTemplate.ts` ya no inventa teléfono/email/logo y usa el nombre de la banda; scout, radar, matcher y audiencia usan «la banda»; ejemplos de `metrics.ts`); el EPK de demo de Bakandeya vive aislado en `server/seeds/demoEpk.ts` (con test) y `sync.ts` solo pregunta `defaultEpkConfigFor(bandId)`; variables de tono de `ReelsCenter.tsx` sin nombre de banda.
* **Pendiente (no se toca sin poder probar contra Supabase real):** (1) la regla «evento sin `band_id` = Bakandeya» en `App.tsx`, `Dashboard.tsx`, `CalendarView.tsx` y `epk_fans.ts` — necesita una migración de datos antiguos antes de borrarla; (2) el caso especial `isBraisUser` / `isBraisMoure` en `server/auth.ts` y `server/routes/users.ts` (toca login y multi-tenant: requiere prueba manual con esa cuenta); (3) semillas de demo de la propia Bakandeya en el cliente (`RepertorioSetlists.tsx` `BAKANDEYA_DEMO_MEMBERS`/`DEFAULT_SONGS`, `Merchan.tsx`, `EPKManager.tsx`) — ya están restringidas a `isBakandeya`, no filtran a otras bandas; mover al servidor es limpieza, no fuga; (4) claves heredadas `bakandeya_token` / `bakandeya_user` en cookie y localStorage — renombrarlas cerraría la sesión a todo el mundo, hacerlo con migración de lectura doble.
* **Por qué importa:** cada rama por nombre de banda es una fuga potencial de datos o textos entre bandas y frena el multi-inquilino real.
* **Estado:** fase 1 hecha; fases 1b y 2 hechas en lo que filtraba texto entre bandas; quedan los cuatro puntos de arriba.

---

### Deuda: modales sin portal (recortados en móvil)
* **Qué:** `SongTransitionPreviewModal` se renderizaba dentro de un ancestro que recortaba cabecera y pie y no se podía cerrar en móvil (arreglado con `ModalPortal` + test `e2e/modal-uniones.spec.ts`; igual en PerfectSetlist, SetlistAIAnalysis, ShowItem, ImportSetlist y SpotifyDiscography). Quedan ~35 ficheros con un overlay `fixed inset-0` que no pasan por `ModalPortal`/`createPortal` (p. ej. `PracticeModePanel`, `CampaignManagerModal`, `AlertSettingsModal`, `GrowthGuidanceModal`, `ReelsTheaterModal`, `AILogoGeneratorModal`…).
* **Siguiente paso:** probar cada uno a 390×700 y envolver en `ModalPortal` los que se recorten; valorar una regla en `design-audit` que exija portal a los overlays modales.

---

### Landing pública (`/`) — siguientes pasos
* **Hecho (octubre 2026):** `PublicLanding` en `/` para quien no tiene sesión (la PWA instalada y los enlaces con query/hash van directos al login); `/login` abre el formulario sin landing; capturas con datos de demo ficticios generadas con `LANDING_SHOTS=1 npx playwright test --project=visual landing-capturas` (salen en `public/landing/`).
* **Banda de demo (octubre 2026):** `e2e/fixtures/demoBand.ts` (miembros, repertorio, setlist, leads, calendario, fans, métricas y EPK) + retratos y escenas ilustrados generados con `node scripts/landing/generar-demo-assets.mjs` (en `public/landing/demo/`). Son ilustraciones, no fotos: para fotos reales de la banda, sustituye esos ficheros y cambia las rutas del fixture. La landing enseña también el dossier público y la página de fans.
* **Dos bandas en la demo:** la cuenta de demo lleva Bakandeya y Ruta 66 (calendario conjunto, selector «¿Quién toca hoy?»). Ruta 66 solo tiene eventos ficticios; faltan logo (`importar_fotos.py logo ruta66 …`), fotos, miembros y repertorio reales para su dossier y su página de fans.
* **Pendiente:** precios visibles (decisión de Diego), versión en inglés, SEO real (la app es una SPA: valorar una página estática/prerender para la raíz), páginas legales (privacidad, condiciones) enlazadas desde el pie, vídeo corto del flujo agente → aprobación, y revisar las capturas cuando cambie la UI.
* **Deuda detectada al hacerla:** tarjetas de redes de Fans (`ReelsMetricsView`) con badges solapados («OAuth / Token») y títulos en rojo; tarjetas de Booking en móvil con chips «Sin datos» de Wegow/Bandsintown que añaden ruido.

---

## 🎨 Mejoras de Diseño y Consistencia de Tokens (Sistema Espectro)

### 1. Limpieza Integral de Tokens Semánticos en Componentes Heredados (Prioridad Alta)
* **Qué:** Auditar y sustituir clases fijas/hardcodeadas de Tailwind (`bg-zinc-800/900`, `text-slate-400`, `border-zinc-800`) por los tokens CSS semánticos de Espectro (`var(--surface)`, `var(--sunken)`, `var(--ink-2)`, `var(--line)`).
* **Por qué importa:** Garantiza que el 100% de la aplicación responda de manera idéntica y con contraste WCAG AA tanto en modo oscuro (*dark*) como en modo claro (*light*) y clásico (*classic*), evitando tarjetas o menús descolocados visualmente.
* **Estado:** Pendiente.

### 2. Modales Densos y Contenedores Responsivos (Prioridad Media)
* **Qué:** Refactorizar modales complejos (ej. `RoomEditorModal`, configuración de agentes y formularios de banda) con arquitectura de 3 capas estrictas: Cabecera fija + Cuerpo con `max-h-[80vh]` y `overflow-y-auto` + Pie sticky de acciones (*Guardar / Cancelar*).
* **Por qué importa:** Evita que en portátiles de 13" o zooms de pantalla del 125% los botones de confirmación y últimos campos queden ocultos o fuera de la pantalla.
* **Estado:** Pendiente.

### 3. Densidad de Información en Vistas de Trabajo Diario (Prioridad Media)
* **Qué:** Optimizar el espaciado vertical en tablas de Leads CRM, Setlists y Repertorio con opción de espaciado compacto (`py-2.5` en filas en lugar de tarjetas gigantes con `--r-xl`).
* **Por qué importa:** Permite a los managers y líderes de banda visualizar 15-20 filas de un vistazo sin scroll continuo innecesario.
* **Estado:** Pendiente.

### 4. Transiciones Suaves y Skeletons de Carga (Prioridad Baja)
* **Qué:** Sustituir spinners planos o estados en blanco por marcadores de posición (*skeleton loaders*) con luminancia `--surface` pulsante mientras se resuelven las llamadas a Supabase.
* **Por qué importa:** Elimina el parpadeo (*layout shift*) al cargar salas, eventos de calendario y métricas.
* **Estado:** Pendiente.

---

## 🔨 En curso

_(vacío)_

---

## ✅ Hecho

### Previsión meteorológica por hora y alertas de escenario en eventos del calendario (Outdoor & Stage Weather Alerts)
* **Fecha:** Septiembre 2026
* **Qué se implementó:**
  1. **Servicio meteorológico Open-Meteo (`weatherService.ts`)**: Integración sin API Key necesaria (código y datos abiertos), con geocodificación automática de ciudades, previsión horaria (temperatura, sensación térmica, probabilidad y volumen de lluvia en mm, ráfagas y velocidad de viento en km/h, código WMO) y caché en memoria para alto rendimiento.
  2. **Sistema Inteligente de Alertas de Escenario (Lluvia, Frío Extremo, Viento Extremo, Tormentas)**:
     - **Clasificación por severidad** (`danger` vs `warning`) con badges de alta visibilidad (`🔴 PELIGRO DE ESCENARIO` y `🟡 PRECAUCIÓN`).
     - **Alerta de Lluvia y Tormenta Eléctrica**: Detección de lluvia intensa (>=40%, >=0.5mm) y tormentas WMO con protocolo de protección eléctrica, carpas y diferenciales.
     - **Alerta de Frío Extremo**: Detección de bajas temperaturas (<=8°C, sensación <=6°C) con consejos para atemperar guitarras/bajos de madera antes de afinar y calentamiento vocal intensivo.
     - **Alerta de Viento Extremo**: Detección de rachas (>=40 km/h o >=55 km/h en danger) con directrices de seguridad para PA volada, trusses, retirada de telones opacos (efecto vela) y uso de antivientos en microfonía.
     - **Tarjetas interactivas desplegables**: Protocolo técnico detallado paso a paso para el rider y el equipo técnico.
  3. **Visualización Omnipresente y No Intrusiva en el Calendario (`CalendarView.tsx`)**:
     - **Celdas del mes**: Indicadores de alerta meteorológica (🌧️, ⚡, ❄️, 💨) junto al número del día si hay conciertos con meteorología adversa.
     - **Panel lateral del día**: `EventWeatherCard` integrado para consultar el clima y alertas sin necesidad de abrir el modal.
     - **Cabecera del modal de evento**: Badges activos de advertencia sincronizados con la ficha del concierto.
     - **Convocatoria 1-Click para WhatsApp**: Las alertas meteorológicas activas se adjuntan automáticamente en el texto formateado de la convocatoria de la banda.
  4. **Hub Integral de Gestión en Modal de Eventos (`CalendarView.tsx`)**:
     - **Edición completa**: Acceso inmediato a edición del evento.
     - **Notificaciones a músicos**: Envío de recordatorio con hora, lugar y previsión.
     - **Convocatoria 1-Click para WhatsApp**: Generación y apertura directa de ficha de convocatoria optimizada con emoticón meteorológico y detalles del bolo.
     - **Copia al portapapeles**: Copia formateada de la ficha de convocatoria.
     - **Eliminación segura in-modal**: Confirmación inline para eliminar conciertos o ensayos directamente desde el modal sin perder contexto.

## Sesión solo por cookie `httpOnly` (diferido, auditoría B)
- Hoy el token vive en `localStorage` Y en la cookie `bakandeya_token` (`httpOnly:false`); el cliente lo lee en ~20 sitios para la cabecera `Authorization`. Marcar la cookie `httpOnly` sin migrar esos sitios rompería la sesión y no protegería de XSS (el token sigue en `localStorage`).
- Hecho: la cookie del servidor lleva `Secure` en producción. Pendiente: migrar el cliente a sesión por cookie (`credentials:'include'` + protección CSRF) y entonces `httpOnly:true`.

## RLS permisivo `USING (true)` (diferido, auditoría B)
- `supabase_schema.sql` (44 políticas) y 7 migraciones crean «Permitir acceso total al backend» con `USING (true)` para TODOS los roles: con la clave anon, cualquiera podría leer/escribir esas tablas. El backend cae a la clave anon si falta `SUPABASE_SERVICE_ROLE_KEY` (`server/db/core.ts`), y en ese caso depende de esas políticas.
- Ahora el servidor avisa en el log si arranca sin `service_role`. **Antes de borrar las políticas** hay que confirmar en Railway que `SUPABASE_SERVICE_ROLE_KEY` está definida y que el log NO muestra el aviso; solo entonces: `DROP POLICY "Permitir acceso total al backend"` en cada tabla (el service_role salta RLS).
- `band_campaigns` (migración 20260919) no se usa en el código (la tabla real es `campaigns`/`booking_campaigns`): migración histórica, no se edita.

## Iris: pendientes de la auditoría de Estudio (diferido)
- **«Iris Pro» (LALAL.AI) retirado de la UI**: nunca hubo selector de motor visible y la ruta de `ai_music.ts` no tenía rama `lalalai` (caía en auto). `LalalAiService` sigue en el repo como código sin usar. Para reactivarlo: enrutarlo por `AudioSeparatorFactory` con un único orquestador de fallback, añadir timeouts a sus `fetch`, corregir `stem=all` contra la API real y comprobar que la clave tiene plan API comercial.
- **URLs temporales**: si falla la subida a Supabase, `AudioSeparatorService` guarda la URL del proveedor (caduca) o una ruta en disco efímero de Railway. Reintentar y no persistirlas como válidas.
- **Auto-balance** (`audioLatency.ts`): un stem casi vacío arrastra al resto al volumen mínimo; ignorar pistas bajo un umbral de RMS.
- **Deriva** en `PracticeModePanel` (sin re-sync periódico, a diferencia del mezclador de `SongStudioModal`).
- **Progreso simulado** en `handlePerformAiStemSeparation`: porcentajes por tiempo, no del proveedor.

## Ear training integrado en las canciones (idea, 2026-10-07)
- **Qué:** educar el oído dentro del Atril/El Oído, con las propias canciones del repertorio: adivinar el siguiente acorde, reconocer grado/función (I–IV–V) sobre la canción real, intervalos de la melodía, «¿en qué tonalidad está?».
- **Por qué importa:** diferencia frente a apps de ear training genéricas (usa SU repertorio) y refuerza el motor armónico que ya existe (`teoriaArmonica`, grados y funciones). Encaja con el modo Estudiar.
- **Estado:** idea, sin evaluar. Retomar tras el Atril unificado (plan maestro, fases 2-3). Recordárselo a Diego si no lo menciona.
