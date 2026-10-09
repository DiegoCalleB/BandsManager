---
id: src_components_ensayos_EnsayosManager
title: "src/components/ensayos/EnsayosManager.tsx"
layer: frontend
domain: system
file: "src/components/ensayos/EnsayosManager.tsx"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/ensayos/EnsayosManager.tsx

> **Ubicación:** `src/components/ensayos/EnsayosManager.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: EnsayosManager.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_SetlistPerformanceView|src/components/SetlistPerformanceView.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_ensayos_ConvocarEnsayoModal|src/components/ensayos/ConvocarEnsayoModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ensayos_EnsayoCronometro|src/components/ensayos/EnsayoCronometro.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ensayos_GrabacionActaTab|src/components/ensayos/GrabacionActaTab.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ensayos_ModoLocalEnVivoTab|src/components/ensayos/ModoLocalEnVivoTab.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ensayos_OrdenDelDiaTab|src/components/ensayos/OrdenDelDiaTab.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_Tabs|src/components/ui/Tabs.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_config_sampleRepertoire|src/config/sampleRepertoire.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_agendaASetlist|src/utils/agendaASetlist.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_App|src/App.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
