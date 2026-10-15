---
id: src_components_bandCRM_hooks_useBandToneAnalysis
title: "src/components/bandCRM/hooks/useBandToneAnalysis.ts"
layer: frontend
domain: booking
file: "src/components/bandCRM/hooks/useBandToneAnalysis.ts"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/bandCRM/hooks/useBandToneAnalysis.ts

> **Ubicación:** `src/components/bandCRM/hooks/useBandToneAnalysis.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Análisis del ADN de tono de una banda con IA.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_bandCRM_BandToneModal|src/components/bandCRM/BandToneModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_bandCRM_hooks_useBandCrmController|src/components/bandCRM/hooks/useBandCrmController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
