---
id: src_components_booking_GooglePlacesExplorerModal
title: "src/components/booking/GooglePlacesExplorerModal.tsx"
layer: frontend
domain: booking
file: "src/components/booking/GooglePlacesExplorerModal.tsx"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/GooglePlacesExplorerModal.tsx

> **Ubicación:** `src/components/booking/GooglePlacesExplorerModal.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Explorador de lugares de Google Places para el CRM de booking.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_booking_google_places_GooglePlacesExplorerProvider|src/components/booking/google_places/GooglePlacesExplorerProvider.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_google_places_GooglePlacesExplorerView|src/components/booking/google_places/GooglePlacesExplorerView.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_google_places_hooks_useGooglePlacesExplorerController|src/components/booking/google_places/hooks/useGooglePlacesExplorerController.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_crm_CrmModalsHost|src/components/booking/crm/CrmModalsHost.tsx]] *(from #frontend)*
- [[src_components_booking_google_places_GooglePlacesExplorerContext|src/components/booking/google_places/GooglePlacesExplorerContext.ts]] *(from #frontend)*
- [[src_components_booking_google_places_hooks_useGooglePlacesExplorerController|src/components/booking/google_places/hooks/useGooglePlacesExplorerController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
