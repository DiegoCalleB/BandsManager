---
id: src_components_bandCRM_hooks_useBandCrud
title: "src/components/bandCRM/hooks/useBandCrud.ts"
layer: frontend
domain: booking
file: "src/components/bandCRM/hooks/useBandCrud.ts"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/bandCRM/hooks/useBandCrud.ts

> **Ubicación:** `src/components/bandCRM/hooks/useBandCrud.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Alta, edición, borrado, importación del scout, favoritas y selección de bandas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_bandMusic|server/routes/bandMusic.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_bandCRM_bandCrmTypes|src/components/bandCRM/bandCrmTypes.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_bandCRM_hooks_useBandCrmController|src/components/bandCRM/hooks/useBandCrmController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
