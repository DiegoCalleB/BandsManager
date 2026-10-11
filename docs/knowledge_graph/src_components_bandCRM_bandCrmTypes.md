---
id: src_components_bandCRM_bandCrmTypes
title: "src/components/bandCRM/bandCrmTypes.ts"
layer: frontend
domain: booking
file: "src/components/bandCRM/bandCrmTypes.ts"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/bandCRM/bandCrmTypes.ts

> **Ubicación:** `src/components/bandCRM/bandCrmTypes.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Tipos de datos y respuestas de la API del CRM de bandas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_users|server/routes/users.ts]] *(Layer: #route, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_bandCRM_hooks_useBandBulkActions|src/components/bandCRM/hooks/useBandBulkActions.ts]] *(from #frontend)*
- [[src_components_bandCRM_hooks_useBandCrmData|src/components/bandCRM/hooks/useBandCrmData.ts]] *(from #frontend)*
- [[src_components_bandCRM_hooks_useBandCrud|src/components/bandCRM/hooks/useBandCrud.ts]] *(from #frontend)*
- [[src_components_bandCRM_hooks_useBandForm|src/components/bandCRM/hooks/useBandForm.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
