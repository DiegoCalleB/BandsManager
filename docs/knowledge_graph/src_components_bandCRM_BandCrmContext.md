---
id: src_components_bandCRM_BandCrmContext
title: "src/components/bandCRM/BandCrmContext.ts"
layer: frontend
domain: booking
file: "src/components/bandCRM/BandCrmContext.ts"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/bandCRM/BandCrmContext.ts

> **Ubicación:** `src/components/bandCRM/BandCrmContext.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Contexto del CRM de bandas: reparte estado y acciones del controlador a las vistas de la pantalla.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_BandCRM|src/components/BandCRM.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_bandCRM_hooks_useBandCrmController|src/components/bandCRM/hooks/useBandCrmController.ts]] *(Layer: #frontend, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_bandCRM_BandCardsGrid|src/components/bandCRM/BandCardsGrid.tsx]] *(from #frontend)*
- [[src_components_bandCRM_BandCrmHeader|src/components/bandCRM/BandCrmHeader.tsx]] *(from #frontend)*
- [[src_components_bandCRM_BandCrmLayout|src/components/bandCRM/BandCrmLayout.tsx]] *(from #frontend)*
- [[src_components_bandCRM_BandCrmModalsHost|src/components/bandCRM/BandCrmModalsHost.tsx]] *(from #frontend)*
- [[src_components_bandCRM_BandCrmProvider|src/components/bandCRM/BandCrmProvider.tsx]] *(from #frontend)*
- [[src_components_bandCRM_BandsEmptyState|src/components/bandCRM/BandsEmptyState.tsx]] *(from #frontend)*
- [[src_components_bandCRM_BandsFilterBar|src/components/bandCRM/BandsFilterBar.tsx]] *(from #frontend)*
- [[src_components_bandCRM_BandsListContainer|src/components/bandCRM/BandsListContainer.tsx]] *(from #frontend)*
- [[src_components_bandCRM_BandsMapView|src/components/bandCRM/BandsMapView.tsx]] *(from #frontend)*
- [[src_components_bandCRM_BandsTable|src/components/bandCRM/BandsTable.tsx]] *(from #frontend)*
- [[src_components_bandCRM_BulkBandsBar|src/components/bandCRM/BulkBandsBar.tsx]] *(from #frontend)*
- [[src_components_bandCRM_RegisteredBandsView|src/components/bandCRM/RegisteredBandsView.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/bandCRM/__tests__/bandCrmContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
