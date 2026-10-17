---
id: src_components_bandCRM_SeguidoresSpotifyManual
title: "src/components/bandCRM/SeguidoresSpotifyManual.tsx"
layer: frontend
domain: booking
file: "src/components/bandCRM/SeguidoresSpotifyManual.tsx"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/bandCRM/SeguidoresSpotifyManual.tsx

> **Ubicación:** `src/components/bandCRM/SeguidoresSpotifyManual.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Seguidores de Spotify anotados a mano. Spotify no los entrega a esta app (modo desarrollo),

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_bandMusic|server/routes/bandMusic.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_bandCRM_BandCardsGrid|src/components/bandCRM/BandCardsGrid.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
