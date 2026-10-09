---
title: "BandManager.io Architecture Knowledge Graph"
tags: ["obsidian", "architecture", "graphify", "tfm"]
---

# 🗺️ BandManager.io — Obsidian Knowledge Graph

Este grafo de conocimiento interactivo mapea de forma determinista todas las capas y módulos del sistema para **Obsidian**, herramientas de desarrollo y agentes de IA.

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

744 nodos: 16 agent · 40 db · 276 frontend · 39 hook · 42 route · 61 schema · 10 security · 260 service.
No se edita a mano: lo regenera `npm run graph:sync` (hook de pre-commit) y el test `grafoConocimiento` falla si queda desfasado.

### 🔥 Los 20 ficheros más importados
- [[src_types|src/types.ts]] — 261 ficheros dependen de él
- [[src_components_ui_index|src/components/ui/index.ts]] — 191 ficheros dependen de él
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] — 112 ficheros dependen de él
- [[src_components_common_ModalPortal|src/components/common/ModalPortal.tsx]] — 75 ficheros dependen de él
- [[src_utils_api|src/utils/api.ts]] — 59 ficheros dependen de él
- [[server_db_core|server/db/core.ts]] — 56 ficheros dependen de él
- [[tabla_registered_bands|tabla registered_bands]] — 56 ficheros dependen de él
- [[db_state_sync|In-Memory State & Supabase Sync]] — 49 ficheros dependen de él
- [[server_ai|server/ai.ts]] — 40 ficheros dependen de él
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] — 38 ficheros dependen de él
- [[src_services_api|src/services/api.ts]] — 36 ficheros dependen de él
- [[server_db|server/db.ts]] — 35 ficheros dependen de él
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] — 31 ficheros dependen de él
- [[server_db_bands|server/db/bands.ts]] — 25 ficheros dependen de él
- [[src_components_ui_PublicoSilhouette|src/components/ui/PublicoSilhouette.tsx]] — 22 ficheros dependen de él
- [[server_utils|server/utils.ts]] — 18 ficheros dependen de él
- [[route_repertoire|Repertoire & Setlists Route]] — 16 ficheros dependen de él
- [[src_components_ui_PopoverAncla|src/components/ui/PopoverAncla.tsx]] — 16 ficheros dependen de él
- [[server_routes_bands|server/routes/bands.ts]] — 15 ficheros dependen de él
- [[src_utils_cn|src/utils/cn.ts]] — 15 ficheros dependen de él

---

## 💡 Cómo Visualizar en Obsidian
1. Abre **Obsidian**.
2. Selecciona **Open folder as vault** y abre la carpeta `docs/knowledge_graph`.
3. Pulsa `Ctrl + G` (o `Cmd + G`) para abrir el **Interactive Graph View**.
4. ¡Disfruta de la visualización en 2D/3D con filtros por capa y dominio!
