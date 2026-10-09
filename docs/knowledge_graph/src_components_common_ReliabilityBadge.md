---
id: src_components_common_ReliabilityBadge
title: "src/components/common/ReliabilityBadge.tsx"
layer: frontend
domain: system
file: "src/components/common/ReliabilityBadge.tsx"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/common/ReliabilityBadge.tsx

> **Ubicación:** `src/components/common/ReliabilityBadge.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: ReliabilityBadge.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_leadReliability|src/utils/leadReliability.ts]] *(Layer: #service, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_BandCRM|src/components/BandCRM.tsx]] *(from #frontend)*
- [[ui_leads_table|Leads Table & Actions]] *(from #frontend)*
- [[ui_venue_detail|Venue Detail & Pitch Simulator]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
