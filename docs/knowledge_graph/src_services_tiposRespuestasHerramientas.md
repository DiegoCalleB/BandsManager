---
id: src_services_tiposRespuestasHerramientas
title: "src/services/tiposRespuestasHerramientas.ts"
layer: service
domain: system
file: "src/services/tiposRespuestasHerramientas.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/services/tiposRespuestasHerramientas.ts

> **Ubicación:** `src/services/tiposRespuestasHerramientas.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Formas de las respuestas del servidor que consumen modales y hooks de herramientas

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_dashboard_agent_autonomy_autonomyTypes|src/components/dashboard/agent_autonomy/autonomyTypes.tsx]] *(Layer: #agent, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_bandCRM_ChangeBandImageModal|src/components/bandCRM/ChangeBandImageModal.tsx]] *(from #frontend)*
- [[src_components_dashboard_agent_autonomy_hooks_useAutonomyConfig|src/components/dashboard/agent_autonomy/hooks/useAutonomyConfig.ts]] *(from #agent)*
- [[src_components_PracticeModePanel|src/components/PracticeModePanel.tsx]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_hooks_useConcertSourceMedia|src/components/repertorio/live_concert_album/hooks/useConcertSourceMedia.ts]] *(from #frontend)*
- [[src_components_repertorio_SpotifyDiscographyModal|src/components/repertorio/SpotifyDiscographyModal.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
