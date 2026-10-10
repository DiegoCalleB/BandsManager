---
id: src_components_booking_google_places_GooglePlacesExplorerContext
title: "src/components/booking/google_places/GooglePlacesExplorerContext.ts"
layer: frontend
domain: booking
file: "src/components/booking/google_places/GooglePlacesExplorerContext.ts"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/google_places/GooglePlacesExplorerContext.ts

> **Ubicación:** `src/components/booking/google_places/GooglePlacesExplorerContext.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Contexto del explorador de lugares: reparte el estado del controlador y las props a las vistas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_booking_GooglePlacesExplorerModal|src/components/booking/GooglePlacesExplorerModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_google_places_hooks_useGooglePlacesExplorerController|src/components/booking/google_places/hooks/useGooglePlacesExplorerController.ts]] *(Layer: #frontend, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_google_places_ExplorerHeader|src/components/booking/google_places/ExplorerHeader.tsx]] *(from #frontend)*
- [[src_components_booking_google_places_GooglePlacesExplorerProvider|src/components/booking/google_places/GooglePlacesExplorerProvider.tsx]] *(from #frontend)*
- [[src_components_booking_google_places_GooglePlacesExplorerView|src/components/booking/google_places/GooglePlacesExplorerView.tsx]] *(from #frontend)*
- [[src_components_booking_google_places_MassCampaignPanel|src/components/booking/google_places/MassCampaignPanel.tsx]] *(from #frontend)*
- [[src_components_booking_google_places_PlaceDiscardedModal|src/components/booking/google_places/PlaceDiscardedModal.tsx]] *(from #frontend)*
- [[src_components_booking_google_places_PlaceDiscardToast|src/components/booking/google_places/PlaceDiscardToast.tsx]] *(from #frontend)*
- [[src_components_booking_google_places_PlacesResultsList|src/components/booking/google_places/PlacesResultsList.tsx]] *(from #frontend)*
- [[src_components_booking_google_places_PlaceStatusBanners|src/components/booking/google_places/PlaceStatusBanners.tsx]] *(from #frontend)*
- [[src_components_booking_google_places_ScoutFilterBar|src/components/booking/google_places/ScoutFilterBar.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/booking/google_places/__tests__/googlePlacesExplorerContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
