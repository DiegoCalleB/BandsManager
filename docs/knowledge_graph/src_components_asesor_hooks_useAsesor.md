---
id: src_components_asesor_hooks_useAsesor
title: "src/components/asesor/hooks/useAsesor.ts"
layer: frontend
domain: system
file: "src/components/asesor/hooks/useAsesor.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/asesor/hooks/useAsesor.ts

> **Ubicación:** `src/components/asesor/hooks/useAsesor.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: EstadoPieza, useAsesor.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_asesorApi|src/utils/asesorApi.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_estrategia|src/utils/asesor/estrategia.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_pieza|src/utils/asesor/pieza.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_resumen|src/utils/asesor/resumen.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_asesor_AsesorView|src/components/asesor/AsesorView.tsx]] *(from #frontend)*
- [[src_components_asesor_PiezaSheet|src/components/asesor/PiezaSheet.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
