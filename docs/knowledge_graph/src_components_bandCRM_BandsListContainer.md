---
id: src_components_bandCRM_BandsListContainer
title: "src/components/bandCRM/BandsListContainer.tsx"
layer: frontend
domain: booking
file: "src/components/bandCRM/BandsListContainer.tsx"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/bandCRM/BandsListContainer.tsx

> **Ubicación:** `src/components/bandCRM/BandsListContainer.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Contenedor de la lista de bandas según la vista (vacío, mapa, tarjetas o tabla).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_bandCRM_BandCardsGrid|src/components/bandCRM/BandCardsGrid.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_bandCRM_BandCrmContext|src/components/bandCRM/BandCrmContext.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_bandCRM_BandsEmptyState|src/components/bandCRM/BandsEmptyState.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_bandCRM_BandsMapView|src/components/bandCRM/BandsMapView.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_bandCRM_BandsTable|src/components/bandCRM/BandsTable.tsx]] *(Layer: #frontend, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_bandCRM_BandsWorkspace|src/components/bandCRM/BandsWorkspace.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
