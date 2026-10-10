---
id: src_components_setlist_performance_PerformancePracticePanel
title: "src/components/setlist_performance/PerformancePracticePanel.tsx"
layer: frontend
domain: repertoire
file: "src/components/setlist_performance/PerformancePracticePanel.tsx"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/setlist_performance/PerformancePracticePanel.tsx

> **Ubicación:** `src/components/setlist_performance/PerformancePracticePanel.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Panel de práctica con stems Iris abierto desde el propio visor.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_PracticeModePanel|src/components/PracticeModePanel.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_setlist_performance_SetlistPerformanceContext|src/components/setlist_performance/SetlistPerformanceContext.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_utils_irisTracks|src/utils/irisTracks.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_setlist_performance_SetlistPerformanceStage|src/components/setlist_performance/SetlistPerformanceStage.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
