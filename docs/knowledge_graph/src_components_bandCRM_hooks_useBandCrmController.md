---
id: src_components_bandCRM_hooks_useBandCrmController
title: "src/components/bandCRM/hooks/useBandCrmController.ts"
layer: frontend
domain: booking
file: "src/components/bandCRM/hooks/useBandCrmController.ts"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/bandCRM/hooks/useBandCrmController.ts

> **Ubicación:** `src/components/bandCRM/hooks/useBandCrmController.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Compone los hooks del CRM de bandas (datos, estado de interfaz, derivados, tono, formulario, CRUD y acciones masivas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_bandCRM_hooks_useBandBulkActions|src/components/bandCRM/hooks/useBandBulkActions.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_bandCRM_hooks_useBandCrmData|src/components/bandCRM/hooks/useBandCrmData.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_bandCRM_hooks_useBandCrmUiState|src/components/bandCRM/hooks/useBandCrmUiState.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_bandCRM_hooks_useBandCrud|src/components/bandCRM/hooks/useBandCrud.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_bandCRM_hooks_useBandDerivedData|src/components/bandCRM/hooks/useBandDerivedData.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_bandCRM_hooks_useBandForm|src/components/bandCRM/hooks/useBandForm.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_bandCRM_hooks_useBandToneAnalysis|src/components/bandCRM/hooks/useBandToneAnalysis.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_BandCRM|src/components/BandCRM.tsx]] *(from #frontend)*
- [[src_components_bandCRM_BandCrmContext|src/components/bandCRM/BandCrmContext.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
