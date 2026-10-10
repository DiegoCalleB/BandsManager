---
id: src_components_bandCRM_hooks_useBandDerivedData
title: "src/components/bandCRM/hooks/useBandDerivedData.ts"
layer: frontend
domain: booking
file: "src/components/bandCRM/hooks/useBandDerivedData.ts"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/bandCRM/hooks/useBandDerivedData.ts

> **Ubicación:** `src/components/bandCRM/hooks/useBandDerivedData.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Bandas filtradas, filtros disponibles, contadores y texto del pitch.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_booking_BandPreviewPlayer|src/components/booking/BandPreviewPlayer.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_spotifyEmbed|src/utils/spotifyEmbed.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_bandCRM_hooks_useBandCrmController|src/components/bandCRM/hooks/useBandCrmController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
