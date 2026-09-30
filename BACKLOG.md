# 📋 BACKLOG.md — Ideas y Tareas Pendientes

> Backlog de producto: ideas, mejoras y features pendientes de evaluar o construir.
> Para directivas técnicas/arquitectura obligatorias, ver `AGENTS.md`.
> Para riesgos legales detectados, ver `AGENTS.md` §8.

Formato de cada entrada: **qué es**, **por qué importa** (impacto real, no "estaría bien"), y **estado**.

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
* **Documentos relacionados:** `plan_anti_fraude.md`
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

### 5. Plan Maestro Defensivo, Acuerdos 1-Click y Directo (`plan_anti_fraude.md`)
* **Qué:** Sistema completo de cierre de conciertos sin fricción con enlace público 1-Click (`/deal/view/:token`), firma electrónica simple válida bajo Reglamento eIDAS (UE 910/2014) con hash SHA-256 inmutable, minimización estricta de datos RGPD, detección de atribución CRM sin espionaje (el *Nudge Elegante* de reactivación) y las 6 innovaciones agénticas de directo:
  1. *WhatsApp Magic Share* para técnico de sonido (ficha de cabina live) y portero (lista de puerta táctil).
  2. *Modo Escenario Offline* con Service Workers e IndexedDB a prueba de sótanos sin cobertura.
  3. *Dynamic Touring Yield Management* (optimización de rutas y relleno de fechas huérfanas con caché dinámico).
  4. *Tech Rider Auto-Adaptativo ("Self-Healing Rider")* con visión artificial y equivalencias de inventario de sala.
  5. *Director de Concierto en Vivo* con ajuste dinámico del Setlist por compatibilidad tonal y toque de queda.
  6. *Smart Settlement Post-Show* integrado con BandSplit.
* **Por qué importa:** Resuelve el problema del "bypass" del CRM mediante incentivos de valor real en vez de sanciones policiales, protege legal y fiscalmente a las bandas y salas, y posiciona a la plataforma como la más avanzada del mundo en tecnología de directo.
* **Documento maestro:** `plan_anti_fraude.md`
* **Estado:** Especificado y validado en arquitectura. Listo para implementar P0 (Esquema SQL + Endpoints `/api/deals` bajo `getTargetBandId` + Vista Web Responsive 1-Click).

### 6. Plan Económico y Técnico de IA (`plan_gestion_tokens_ia.md`)
* **Qué:** Modelo híbrido de dos niveles para el uso de modelos de lenguaje y generación multimedia:
  1. *Texto Ilimitado con Fair Use* (Scout, Redactor, Lector, Contestador, Chat) protegido por una ventana móvil de 5 horas que resetea cuota cada 15 minutos, sin que el usuario sienta barreras artificiales de recarga.
  2. *Cupos de Estudio Multimedia* para tareas pesadas de GPU/CPU (Separación de Stems con Replicate/Iris y Renderizado de Reels con Remotion/FFmpeg), con pases mensuales + acumulador permanente (*Rollover con tope*) y bonificaciones vitalicias por conciertos confirmados (`studio_bonus_stems`, `studio_bonus_reels`).
* **Por qué importa:** Garantiza un margen bruto superior al 98% (coste por usuario activo < 0,15 €/mes), elimina la frustración de la "moneda virtual de créditos" en tareas conversacionales y alinea la economía del SaaS con la rentabilidad empresarial.
* **Documento maestro:** `plan_gestion_tokens_ia.md`
* **Estado:** Especificado y validado económicamente. Listo para aterrizar en `planLimits.ts` y controladores de billing.

### 7. BandSplit / TourCount: El "CFO de Banda con IA" para Gira y Local (`splitband.md`)
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
* **Documento maestro:** `splitband.md`
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
* **Estado:** idea capturada, sin prototipar. Siguiente paso si se retoma: probar `essentia.js` contra un stem de guitarra ya separado por Iris y medir precisión real antes de comprometer tiempo de desarrollo en la UI.

### Deuda de diseño: lo que queda tras las fases F3–F9
* **Qué:** las primitivas (`Input`, `Textarea`, `Select`, `Field`, `Switch`, `Card`, `EmptyState`, `Button`) ya cubren los campos (≈650 migrados; los que quedan llevan `data-raw` con motivo), unas 400 píldoras/alternancias y ≈240 botones de solo icono (`IconButton`, con nombre accesible obligatorio). Quedan ~1.300 `<button>` escritos a mano: pestañas (~110), filas de menú (~100) y de texto suelto; visualmente coherentes, pero sin primitiva.
* **Siguiente paso:** primitivas `Tabs` / `Segmented` (aspecto activo/inactivo único), `MenuItem` (filas de ⋮) y `IconButton` con `aria-label` obligatorio; después un codemod por patrón y pasar `botonSinPrimitiva` de aviso a error en `design-audit`.
* **Revisión con datos reales:** falta revisar con la banda real (Ruta 66) la tabla de Booking (chips «12 lib.», Fiabilidad), Merchandising y Agente Mánager en oscuro; la semilla no reproduce esos volúmenes.
* **Estado:** F3, F5, F6, F8 hechas; F4 al ~40 % de los botones; F7 y F9 hechas salvo lo que exige datos reales.

### Deuda: datos de bandas concretas (Bakandeya, Ruta 66, Master of Prompts…) todavía en código
* **Qué:** auditoría de octubre 2026. Ya limpiado (fase 1): pitches y firmas de BandCRM, asunto del Chatbot, redes de ejemplo en FansLanding, logos y nombres por defecto y hoja de ruta / material de ejemplo del Calendario, texto del rider en Booking, líneas inventadas del dossier PDF, géneros por defecto (“Balkan Ska”) y etiqueta “Balkan Hype”.
* **Pendiente (fase 1b — solo afecta a la propia banda demo):** `RepertorioSetlists.tsx` (`BAKANDEYA_DEMO_MEMBERS`, `DEFAULT_SONGS`, `DEFAULT_SETLISTS`, ramas `isBakandeya` / `isMasterOfPrompts`), `Merchan.tsx` (álbumes y catálogo demo), `EPKManager.tsx` (`DEFAULT_EPK_CONFIG`), `ReelsCenter.tsx` (nombres de variables “Bakandeya…”). Mover a semillas del servidor y que el componente lea solo de la API.
* **Pendiente (fase 2 — servidor, toca login y multi-tenant):** caso especial `isBraisUser` en `/auth/me` y `server/routes/users.ts`, `server/auth.ts`, `server/db/sync.ts` (bio por defecto), `server/utils/emailTemplate.ts` (pie de Bakandeya), `server/utils/bandProfile.ts` (Ruta 66) y la regla “evento sin `band_id` = Bakandeya” en `App.tsx`, `Dashboard.tsx`, `CalendarView.tsx` (migrar datos antiguos y borrar la regla).
* **Por qué importa:** cada rama por nombre de banda es una fuga potencial de datos o textos entre bandas y frena el multi-inquilino real.
* **Estado:** fase 1 hecha; fases 1b y 2 sin empezar.

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
