---
id: src_utils_armoniaVisor
title: "src/utils/armoniaVisor.ts"
layer: service
domain: system
file: "src/utils/armoniaVisor.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/armoniaVisor.ts

> **Ubicación:** `src/utils/armoniaVisor.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: InfoChip, infoDeAcordeVisible.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_lineaTiempoAcordes|src/utils/lineaTiempoAcordes.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_teoriaArmonica|src/utils/teoriaArmonica.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_Atril|src/components/Atril.tsx]] *(from #frontend)*
- [[src_utils_vistaAcordes|src/utils/vistaAcordes.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/armoniaVisor.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
