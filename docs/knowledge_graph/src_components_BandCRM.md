---
id: src_components_BandCRM
title: "src/components/BandCRM.tsx"
layer: frontend
domain: booking
file: "src/components/BandCRM.tsx"
tags: ["frontend", "booking", "auto", "pantalla"]
---

# 📌 src/components/BandCRM.tsx

> **Ubicación:** `src/components/BandCRM.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Exporta: BandCRM.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_bandMusic|server/routes/bandMusic.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_users|server/routes/users.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_BandMap|src/components/BandMap.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_bandCRM_AIBandScoutModal|src/components/bandCRM/AIBandScoutModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_bandCRM_AddEditBandModal|src/components/bandCRM/AddEditBandModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_bandCRM_BandPitchModal|src/components/bandCRM/BandPitchModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_bandCRM_BandToneModal|src/components/bandCRM/BandToneModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_bandCRM_ChangeBandImageModal|src/components/bandCRM/ChangeBandImageModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_bandCRM_SpotifySweepModal|src/components/bandCRM/SpotifySweepModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_bands_BulkBandActionBar|src/components/bands/BulkBandActionBar.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_booking_BandListenEmbed|src/components/booking/BandListenEmbed.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_BandPreviewPlayer|src/components/booking/BandPreviewPlayer.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_BulkProgressModal|src/components/booking/BulkProgressModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_common_FavoriteButton|src/components/common/FavoriteButton.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_common_ReliabilityBadge|src/components/common/ReliabilityBadge.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_common_VerifiedBadge|src/components/common/VerifiedBadge.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_instagramPerfil|src/utils/instagramPerfil.ts]] *(Layer: #service, Domain: #social)*
- [[src_utils_leadReliability|src/utils/leadReliability.ts]] *(Layer: #service, Domain: #booking)*
- [[src_utils_spotifyEmbed|src/utils/spotifyEmbed.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_App|src/App.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
