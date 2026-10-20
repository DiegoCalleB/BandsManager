---
title: "BandManager.io Architecture Knowledge Graph"
tags: ["obsidian", "architecture", "graphify", "tfm"]
---

# 🗺️ BandManager.io — Obsidian Knowledge Graph

Este grafo de conocimiento interactivo mapea de forma determinista todas las capas y módulos del sistema para **Obsidian**, herramientas de desarrollo y agentes de IA.

---

## ⭐ Funciones clave de la aplicación
Cada una enlaza pantalla → ruta → servicio/agente → tabla → proveedor externo. Abre una y expande sus conexiones.
- [[fn_acceso_sesion|Acceso y sesión]] — Login (email o Google), sesión por cookie y multi-banda: de quién es cada petición.
- [[fn_agentes_correo|Agentes de correo]] — Scheduler, lector (Gmail/IMAP) y enviador con humano en el bucle.
- [[fn_asistente_ia|Asistente de IA (chat)]] — Chatbot con herramientas que lee y actúa sobre los datos de la banda.
- [[fn_booking_crm|Booking CRM y pitch]] — Embudo de salas y festivales: leads, enriquecimiento, pitch con IA, respuestas y seguimiento.
- [[fn_conciertos_qr|Conciertos, QR y calendario]] — Bolos confirmados, calendario, página pública del concierto, QR y enlaces cortos.
- [[fn_ensayos|Ensayos]] — Convocatorias, orden del día, acta y seguimiento del ensayo.
- [[fn_fans_epk|Fans y EPK]] — Captación de fans, landing pública y dossier de prensa (EPK).
- [[fn_finanzas_planes|Finanzas, merchan y planes]] — Ingresos, gastos, merchan, donaciones, planes y cobro con Stripe.
- [[fn_gira|Tour Manager]] — Planificación de giras, logística y rutas entre bolos.
- [[fn_iris_estudio|Estudio de canción e Iris (stems)]] — Separación de pistas, mezcla, ideas de audio y descarga desde el estudio de canción.
- [[fn_metricas_panel|Panel y métricas]] — Dashboard de la banda con métricas de Spotify, redes y actividad.
- [[fn_reels_social|Reels y redes sociales]] — Generación de reels virales, publicaciones y plan de crecimiento.
- [[fn_repertorio_setlists|Repertorio y setlists]] — Catálogo de canciones, setlists, atril, modo escenario y práctica.
- [[fn_scout_salas|Búsqueda de salas y festivales]] — Descubrimiento de salas, eventos y contactos desde fuentes abiertas, mapas y redes.

## 🌐 Servicios externos
- [[ext_correo_smtp_imap|Correo SMTP / IMAP]] — 4 ficheros lo usan
- [[ext_fal|fal.ai]] — 9 ficheros lo usan
- [[ext_ffmpeg|FFmpeg]] — 34 ficheros lo usan
- [[ext_gemini|Gemini (Google GenAI)]] — 18 ficheros lo usan
- [[ext_google_oauth_gmail|Google OAuth / Gmail API]] — 7 ficheros lo usan
- [[ext_replicate|Replicate]] — 11 ficheros lo usan
- [[ext_resend|Resend]] — 7 ficheros lo usan
- [[ext_sentry|Sentry]] — 2 ficheros lo usan
- [[ext_spotify|Spotify]] — 7 ficheros lo usan
- [[ext_stripe|Stripe]] — 4 ficheros lo usan
- [[ext_supabase|Supabase (Postgres)]] — 4 ficheros lo usan
- [[ext_supabase_storage|Supabase Storage]] — 8 ficheros lo usan

---

## 🧭 Vista por Dominios Principales

### 🎯 1. Booking CRM & Agentes de IA
- [[ui_booking_crm|Panel Principal de Booking CRM]]
- [[ui_leads_table|Tabla de Salas & Leads]]
- [[ui_venue_detail|Ficha Técnica & Simulador de Pitch]]
- [[agent_scheduler|Scheduler In-Process (tick 24 h por defecto)]]
- [[agent_enviador|Enviador Agent (Human-in-the-Loop)]]
- [[agent_lector|Lector Agent (Gmail OAuth2/IMAP)]]
- [[service_pitch_engine|Motor Multi-Modelo (Gemini / DeepSeek / OpenAI)]]

### 📅 Calendario & Choques
- [[ui_calendar_conflicts|Avisos en el calendario]]
- [[util_calendar_conflicts|Detector de choques]]
- [[util_viaje_estimado|Estimador de viaje]]
- [[service_calendar_conflicts|Avisos por email]]
- [[db_calendar_conflicts|Persistencia de avisos]]
- [[route_calendar_conflicts|GET /api/calendar/conflicts]]

### 🔒 2. Seguridad & Trust Boundary
- [[sec_trust_boundary|Límite de Confianza (getTargetBandId)]]
- [[sec_ssrf_guard|Protección SSRF (esUrlExternaSegura)]]
- [[sec_prompt_safety|Sanitizador Anti-Prompt Injection]]

### 🎵 3. Repertorio, Audio & Setlists
- [[ui_repertoire_setlists|Repertorio & Setlists UI]]
- [[db_repertoire|Manejadores de Base de Datos de Repertorio]]

### 💾 4. Persistencia & Estado
- [[db_leads|Manejador de Leads en Supabase]]
- [[db_lead_messages|Historial de Mensajes]]
- [[db_ai_ledger|Contabilidad de Tokens (aiLedger)]]
- [[db_state_sync|Sincronización de Estado en Memoria]]
- [[schema_supabase|Esquema PostgreSQL de Supabase]]

---

## 🤖 Mapa automático (generado desde los imports reales)

1818 nodos: 53 agent · 55 db · 12 external · 14 feature · 967 frontend · 43 hook · 95 route · 78 schema · 12 security · 489 service.
No se edita a mano: lo regenera `npm run graph:sync` (hook de pre-commit) y el test `grafoConocimiento` falla si queda desfasado.

### 🔥 Los 20 ficheros más importados
- [[src_types|src/types.ts]] — 575 ficheros dependen de él
- [[src_components_ui_index|src/components/ui/index.ts]] — 366 ficheros dependen de él
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] — 180 ficheros dependen de él
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] — 173 ficheros dependen de él
- [[src_utils_api|src/utils/api.ts]] — 95 ficheros dependen de él
- [[src_components_common_ModalPortal|src/components/common/ModalPortal.tsx]] — 80 ficheros dependen de él
- [[tabla_registered_bands|tabla registered_bands]] — 72 ficheros dependen de él
- [[db_state_sync|In-Memory State & Supabase Sync]] — 71 ficheros dependen de él
- [[server_db_core|server/db/core.ts]] — 68 ficheros dependen de él
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] — 62 ficheros dependen de él
- [[server_db|server/db.ts]] — 53 ficheros dependen de él
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] — 49 ficheros dependen de él
- [[server_ai|server/ai.ts]] — 48 ficheros dependen de él
- [[src_services_api|src/services/api.ts]] — 45 ficheros dependen de él
- [[server_utils_errorHttp|server/utils/errorHttp.ts]] — 39 ficheros dependen de él
- [[server_db_bands|server/db/bands.ts]] — 37 ficheros dependen de él
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] — 37 ficheros dependen de él
- [[ext_ffmpeg|FFmpeg]] — 34 ficheros dependen de él
- [[server_routes_bands|server/routes/bands.ts]] — 34 ficheros dependen de él
- [[src_utils_errorMessage|src/utils/errorMessage.ts]] — 33 ficheros dependen de él

---

## 💡 Cómo Visualizar en Obsidian
1. Abre **Obsidian**.
2. Selecciona **Open folder as vault** y abre la carpeta `docs/knowledge_graph`.
3. Pulsa `Ctrl + G` (o `Cmd + G`) para abrir el **Interactive Graph View**.
4. ¡Disfruta de la visualización en 2D/3D con filtros por capa y dominio!
