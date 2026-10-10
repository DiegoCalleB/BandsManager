---
id: src_components_booking_google_places_hooks_useGooglePlacesExplorerController
title: "src/components/booking/google_places/hooks/useGooglePlacesExplorerController.ts"
layer: frontend
domain: booking
file: "src/components/booking/google_places/hooks/useGooglePlacesExplorerController.ts"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/google_places/hooks/useGooglePlacesExplorerController.ts

> **Ubicación:** `src/components/booking/google_places/hooks/useGooglePlacesExplorerController.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Controlador del explorador de lugares: compone los hooks por subdominio (filtros, resultados,

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_booking_GooglePlacesExplorerModal|src/components/booking/GooglePlacesExplorerModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_google_places_hooks_useDiscardedPlaces|src/components/booking/google_places/hooks/useDiscardedPlaces.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_google_places_hooks_usePlaceCrmImport|src/components/booking/google_places/hooks/usePlaceCrmImport.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_google_places_hooks_usePlaceEmailExtraction|src/components/booking/google_places/hooks/usePlaceEmailExtraction.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_google_places_hooks_usePlaceResults|src/components/booking/google_places/hooks/usePlaceResults.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_google_places_hooks_usePlaceSearch|src/components/booking/google_places/hooks/usePlaceSearch.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_google_places_hooks_useScoutFilters|src/components/booking/google_places/hooks/useScoutFilters.ts]] *(Layer: #frontend, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_google_places_GooglePlacesExplorerContext|src/components/booking/google_places/GooglePlacesExplorerContext.ts]] *(from #frontend)*
- [[src_components_booking_GooglePlacesExplorerModal|src/components/booking/GooglePlacesExplorerModal.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
