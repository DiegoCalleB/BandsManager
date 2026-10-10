---
id: src_components_booking_BandPreviewPlayer
title: "src/components/booking/BandPreviewPlayer.tsx"
layer: frontend
domain: booking
file: "src/components/booking/BandPreviewPlayer.tsx"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/BandPreviewPlayer.tsx

> **Ubicación:** `src/components/booking/BandPreviewPlayer.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Exporta: ColaBanda, BandPreviewPlayer.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_bandMusic|server/routes/bandMusic.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_bandCRM_BandCrmModalsHost|src/components/bandCRM/BandCrmModalsHost.tsx]] *(from #frontend)*
- [[src_components_bandCRM_hooks_useBandCrmData|src/components/bandCRM/hooks/useBandCrmData.ts]] *(from #frontend)*
- [[src_components_bandCRM_hooks_useBandDerivedData|src/components/bandCRM/hooks/useBandDerivedData.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
