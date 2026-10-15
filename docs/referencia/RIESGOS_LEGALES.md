# Riesgos Legales y Auditorías Técnicas — BandManager.io

Documento satélite de seguimiento de riesgos regulatorios, cumplimiento legal (RGPD, LSSICE, copyright) y hallazgos específicos de auditorías técnicas. Se consulta bajo demanda.

---

## 1. Riesgos Legales Detectados (Pendientes de Mitigar)

> `TERMS_OF_SERVICE.md` protege la propiedad intelectual del código frente a terceros, pero no cubre el tratamiento de datos y contenido de terceros en producción.

### 1.1 🔴 Descarga de YouTube sin verificar titularidad
* **Archivos clave:** `server/routes/concert_to_album.ts`, `server/routes/reels.ts`, `server/utils/youtubeSource.ts`
* Uso de `ytdl-core` / `yt-dlp` con banderas anti-bot y gestión de cookies.
* Incumplimiento de ToS de YouTube e infracción potencial de copyright si la URL no es contenido propio de la banda.
* **Mitigación obligatoria antes de producción:** exigir confirmación explícita de titularidad de contenido antes de procesar y valorar verificación de canal oficial.

### 1.2 🔴 Credenciales de email en texto plano
* **Archivos clave:** `server/db/emailAccounts.ts`
* El `app_password` de Gmail de cada banda se guarda sin cifrar en Supabase (solo se excluye en respuestas HTTP).
* Fuga comprometería el buzón de la banda (infracción del Art. 32 RGPD).
* **Mitigación obligatoria:** cifrar `app_password` en reposo (AES-256 con clave en variable de entorno) antes de abrir a bandas reales.

### 1.3 🟠 Emails comerciales automatizados sin mecanismo de baja
* **Archivos clave:** `server/routes/leads/pitch.ts`, `server/services/emailAgentClient.ts`, `server/services/agentEngine.ts`
* El outreach a salas/festivales no incluye enlace o gestión de opt-out/baja visible.
* LSSICE (art. 21, España) exige opción de baja en comunicaciones comerciales.
* **Mitigación:** añadir pie con opción de baja y registrar opt-out por lead.

### 1.4 🟠 Scraping de redes sociales con User-Agent falseado
* **Archivos clave:** `server/services/socialRadarService.ts`
* Suplanta User-Agent de Chrome para métricas públicas de Instagram/TikTok/YouTube.
* Incumple ToS de plataformas (riesgo de bloqueo de IP).
* **Mitigación:** documentar riesgo y priorizar APIs oficiales cuando el volumen lo justifique.

### 1.5 🟠 Datos personales de contactos de salas sin base documentada
* **Archivos clave:** `server/routes/leads/enrichment.ts`
* Nombre, email y teléfono de programadores scrapeados.
* **Mitigación:** documentar base de legitimación (interés legítimo B2B) en política de privacidad y ofrecer canal de oposición.

### 1.6 🟠 Sin mecanismo de borrado/exportación de cuenta (RGPD art. 17/20)
* No existe autoservicio para borrado en cascada de datos (stems, credenciales, leads, tokens OAuth) ni exportación.
* **Mitigación:** procedimiento manual documentado vía soporte para cumplir plazos legales.

### 1.7 🟠 Accesibilidad web en superficies públicas
* Superficies públicas (`/epk`, fans, QR de conciertos) no tienen auditoría formal de contraste ni lectores de pantalla.
* **Mitigación:** auditoría Lighthouse/axe de componentes públicos antes de comercialización.

---

## 2. Notas Técnicas de Auditorías (Referencia Específica)

### 2.1 Gmail OAuth, cookies y límites de cuerpo
* `state` de Gmail OAuth lleva nonce firmado + cookie HttpOnly y se consume una sola vez (`validarYConsumirEstadoOAuth`).
* Límites JSON: 1 MB para peticiones anónimas, 50 MB con sesión válida (`server/middleware/limiteCuerpo.ts`).

### 2.2 Enviador y cola de agentes
* Borrador de Gmail en 404 no equivale a enviado: se confirma con `buscarMensajeEnviadoA` (30 días).
* Trabajos `processing` en `agent_jobs_queue` con `locked_until` vencido >10 min se recuperan automáticamente (`recuperarTrabajosColgados`).

### 2.3 Guardado optimista y UI
* Peticiones optimistas usan `guardarOReverter(peticion, revertir)` (`src/utils/guardarConReversion.ts`) para revertir el estado si falla la red.
* Desplegables flotantes usan `ActionMenu` o `PopoverAncla` (`src/components/ui/PopoverAncla.tsx`) para evitar recortes en contenedores con `overflow-hidden`.
* Pila de botones flotantes en móvil (de abajo arriba): barra navegación (64 px) → Agent IA (`bottom-20`) → FAB de vista (`bottom-36`).
