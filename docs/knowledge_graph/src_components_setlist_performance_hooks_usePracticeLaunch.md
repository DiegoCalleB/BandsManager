---
id: src_components_setlist_performance_hooks_usePracticeLaunch
title: "src/components/setlist_performance/hooks/usePracticeLaunch.ts"
layer: frontend
domain: repertoire
file: "src/components/setlist_performance/hooks/usePracticeLaunch.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/setlist_performance/hooks/usePracticeLaunch.ts

> **Ubicación:** `src/components/setlist_performance/hooks/usePracticeLaunch.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Lanzamiento del modo práctica (stems Iris) y del estudio desde el directo.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_irisTracks|src/utils/irisTracks.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_setlist_performance_hooks_useSetlistPerformanceController|src/components/setlist_performance/hooks/useSetlistPerformanceController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
