---
id: src_components_bandCRM_BandCardsGrid
title: "src/components/bandCRM/BandCardsGrid.tsx"
layer: frontend
domain: booking
file: "src/components/bandCRM/BandCardsGrid.tsx"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/bandCRM/BandCardsGrid.tsx

> **Ubicación:** `src/components/bandCRM/BandCardsGrid.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Vista de tarjetas de las bandas con selección y acciones.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_bandCRM_BandCrmContext|src/components/bandCRM/BandCrmContext.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_bandCRM_BandStatusBadge|src/components/bandCRM/BandStatusBadge.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_bandCRM_bandMetrics|src/components/bandCRM/bandMetrics.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_BandListenEmbed|src/components/booking/BandListenEmbed.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_common_FavoriteButton|src/components/common/FavoriteButton.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_common_ReliabilityBadge|src/components/common/ReliabilityBadge.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_common_VerifiedBadge|src/components/common/VerifiedBadge.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_utils_instagramPerfil|src/utils/instagramPerfil.ts]] *(Layer: #service, Domain: #social)*
- [[src_utils_leadReliability|src/utils/leadReliability.ts]] *(Layer: #service, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_bandCRM_BandsListContainer|src/components/bandCRM/BandsListContainer.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
