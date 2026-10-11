---
id: src_components_booking_google_places_placesModel
title: "src/components/booking/google_places/placesModel.ts"
layer: frontend
domain: booking
file: "src/components/booking/google_places/placesModel.ts"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/google_places/placesModel.ts

> **Ubicación:** `src/components/booking/google_places/placesModel.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Modelo del explorador de lugares: tipos, categorías, ciudades rápidas y descartados persistidos.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_google_places_hooks_useAlternativePlaceSources|src/components/booking/google_places/hooks/useAlternativePlaceSources.ts]] *(from #frontend)*
- [[src_components_booking_google_places_hooks_useDiscardedPlaces|src/components/booking/google_places/hooks/useDiscardedPlaces.ts]] *(from #frontend)*
- [[src_components_booking_google_places_hooks_useMassCampaignSearch|src/components/booking/google_places/hooks/useMassCampaignSearch.ts]] *(from #frontend)*
- [[src_components_booking_google_places_hooks_usePlaceCrmImport|src/components/booking/google_places/hooks/usePlaceCrmImport.ts]] *(from #frontend)*
- [[src_components_booking_google_places_hooks_usePlaceEmailExtraction|src/components/booking/google_places/hooks/usePlaceEmailExtraction.ts]] *(from #frontend)*
- [[src_components_booking_google_places_hooks_usePlaceResults|src/components/booking/google_places/hooks/usePlaceResults.ts]] *(from #frontend)*
- [[src_components_booking_google_places_hooks_usePlaceSearch|src/components/booking/google_places/hooks/usePlaceSearch.ts]] *(from #frontend)*
- [[src_components_booking_google_places_PlacesResultsList|src/components/booking/google_places/PlacesResultsList.tsx]] *(from #frontend)*
- [[src_components_booking_google_places_ScoutFilterBar|src/components/booking/google_places/ScoutFilterBar.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/booking/google_places/__tests__/googlePlacesExplorerContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
