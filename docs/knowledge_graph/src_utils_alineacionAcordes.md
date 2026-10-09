---
id: src_utils_alineacionAcordes
title: "src/utils/alineacionAcordes.ts"
layer: service
domain: system
file: "src/utils/alineacionAcordes.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/alineacionAcordes.ts

> **Ubicación:** `src/utils/alineacionAcordes.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: esTokenAcorde, esLineaCabecera, acordesDelCifrado, transponerAcorde, ParAlineado, Alineacion, alinearCifradoConAudio, lineaDeCadaAcorde.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_lineaTiempoAcordes|src/utils/lineaTiempoAcordes.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_Atril|src/components/Atril.tsx]] *(from #frontend)*
- [[src_utils_vistaAcordes|src/utils/vistaAcordes.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
