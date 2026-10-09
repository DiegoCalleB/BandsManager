---
id: src_components_repertorio_hooks_useEnergyMapData
title: "src/components/repertorio/hooks/useEnergyMapData.ts"
layer: frontend
domain: system
file: "src/components/repertorio/hooks/useEnergyMapData.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/repertorio/hooks/useEnergyMapData.ts

> **Ubicación:** `src/components/repertorio/hooks/useEnergyMapData.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Datos memoizados del Mapa de Energía del setlist activo: curva, dominio, zonas y análisis de choques.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_energyPacingUtils|src/utils/energyPacingUtils.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_harmonicAnalysis|src/utils/harmonicAnalysis.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_setlistCompatibility|src/utils/setlistCompatibility.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
