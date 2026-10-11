---
id: src_components_BandCRM
title: "src/components/BandCRM.tsx"
layer: frontend
domain: booking
file: "src/components/BandCRM.tsx"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/BandCRM.tsx

> **Ubicación:** `src/components/BandCRM.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
CRM de bandas aliadas: contactos, intercambio de fechas (swaps), pitches y tono de comunicación.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_bandCRM_BandCrmLayout|src/components/bandCRM/BandCrmLayout.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_bandCRM_BandCrmProvider|src/components/bandCRM/BandCrmProvider.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_bandCRM_hooks_useBandCrmController|src/components/bandCRM/hooks/useBandCrmController.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_app_lazyViews|src/app/lazyViews.ts]] *(from #service)*
- [[src_components_bandCRM_BandCrmContext|src/components/bandCRM/BandCrmContext.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
