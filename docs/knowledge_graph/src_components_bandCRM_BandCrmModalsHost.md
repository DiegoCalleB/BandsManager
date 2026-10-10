---
id: src_components_bandCRM_BandCrmModalsHost
title: "src/components/bandCRM/BandCrmModalsHost.tsx"
layer: frontend
domain: booking
file: "src/components/bandCRM/BandCrmModalsHost.tsx"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/bandCRM/BandCrmModalsHost.tsx

> **Ubicación:** `src/components/bandCRM/BandCrmModalsHost.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Modales del CRM de bandas: alta/edición, pitch, tono, barrido de Spotify, reproductor, scout y progreso masivo.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_bandCRM_AIBandScoutModal|src/components/bandCRM/AIBandScoutModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_bandCRM_AddEditBandModal|src/components/bandCRM/AddEditBandModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_bandCRM_BandCrmContext|src/components/bandCRM/BandCrmContext.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_bandCRM_BandPitchModal|src/components/bandCRM/BandPitchModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_bandCRM_BandToneModal|src/components/bandCRM/BandToneModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_bandCRM_SpotifySweepModal|src/components/bandCRM/SpotifySweepModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_bandCRM_bandCrmTheme|src/components/bandCRM/bandCrmTheme.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_BandPreviewPlayer|src/components/booking/BandPreviewPlayer.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_BulkProgressModal|src/components/booking/BulkProgressModal.tsx]] *(Layer: #frontend, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_bandCRM_BandCrmLayout|src/components/bandCRM/BandCrmLayout.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
