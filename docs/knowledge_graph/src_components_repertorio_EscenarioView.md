---
id: src_components_repertorio_EscenarioView
title: "src/components/repertorio/EscenarioView.tsx"
layer: frontend
domain: system
file: "src/components/repertorio/EscenarioView.tsx"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/repertorio/EscenarioView.tsx

> **Ubicación:** `src/components/repertorio/EscenarioView.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: EscenarioView.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_ui_PublicoSilhouette|src/components/ui/PublicoSilhouette.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_formatSongTitle|src/utils/formatSongTitle.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_stageOfflineCache|src/utils/stageOfflineCache.ts]] *(Layer: #service, Domain: #system)*
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(Layer: #frontend, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
