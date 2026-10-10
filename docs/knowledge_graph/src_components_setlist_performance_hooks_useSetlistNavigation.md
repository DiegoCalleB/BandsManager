---
id: src_components_setlist_performance_hooks_useSetlistNavigation
title: "src/components/setlist_performance/hooks/useSetlistNavigation.ts"
layer: frontend
domain: repertoire
file: "src/components/setlist_performance/hooks/useSetlistNavigation.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/setlist_performance/hooks/useSetlistNavigation.ts

> **Ubicación:** `src/components/setlist_performance/hooks/useSetlistNavigation.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Elementos del repertorio, posición actual y navegación entre ellos.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_setlist_performance_performanceModel|src/components/setlist_performance/performanceModel.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_hooks_useNavegacionItems|src/hooks/useNavegacionItems.ts]] *(Layer: #hook, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_irisTracks|src/utils/irisTracks.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_setlist_performance_hooks_useSetlistPerformanceController|src/components/setlist_performance/hooks/useSetlistPerformanceController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
