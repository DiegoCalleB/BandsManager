---
id: src_components_booking_google_places_hooks_usePlaceSearch
title: "src/components/booking/google_places/hooks/usePlaceSearch.ts"
layer: frontend
domain: booking
file: "src/components/booking/google_places/hooks/usePlaceSearch.ts"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/google_places/hooks/usePlaceSearch.ts

> **Ubicación:** `src/components/booking/google_places/hooks/usePlaceSearch.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Exporta: PlaceSearchParams, usePlaceSearch.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_leads_crud|Leads CRUD Route]] *(Layer: #route, Domain: #booking)*
- [[src_components_booking_google_places_hooks_useAlternativePlaceSources|src/components/booking/google_places/hooks/useAlternativePlaceSources.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_google_places_hooks_useMassCampaignSearch|src/components/booking/google_places/hooks/useMassCampaignSearch.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_google_places_placesModel|src/components/booking/google_places/placesModel.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_google_places_hooks_useGooglePlacesExplorerController|src/components/booking/google_places/hooks/useGooglePlacesExplorerController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
