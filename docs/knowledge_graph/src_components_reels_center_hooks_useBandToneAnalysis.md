---
id: src_components_reels_center_hooks_useBandToneAnalysis
title: "src/components/reels_center/hooks/useBandToneAnalysis.ts"
layer: frontend
domain: social
file: "src/components/reels_center/hooks/useBandToneAnalysis.ts"
tags: ["frontend", "social", "auto"]
---

# 📌 src/components/reels_center/hooks/useBandToneAnalysis.ts

> **Ubicación:** `src/components/reels_center/hooks/useBandToneAnalysis.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/social`

## 📖 Descripción
Análisis del tono de expresión de la banda y reglas aprendidas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_bandCRM_BandToneModal|src/components/bandCRM/BandToneModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_reels_center_reelsApiTypes|src/components/reels_center/reelsApiTypes.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_reels_center_hooks_useReelsCenterController|src/components/reels_center/hooks/useReelsCenterController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
