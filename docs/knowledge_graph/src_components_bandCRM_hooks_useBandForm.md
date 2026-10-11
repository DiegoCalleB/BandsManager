---
id: src_components_bandCRM_hooks_useBandForm
title: "src/components/bandCRM/hooks/useBandForm.ts"
layer: frontend
domain: booking
file: "src/components/bandCRM/hooks/useBandForm.ts"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/bandCRM/hooks/useBandForm.ts

> **Ubicación:** `src/components/bandCRM/hooks/useBandForm.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Formulario de banda: campos, logo, búsqueda con IA y aplicación de los datos propuestos.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_bandCRM_bandCrmTypes|src/components/bandCRM/bandCrmTypes.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_bandCRM_hooks_useBandCrmController|src/components/bandCRM/hooks/useBandCrmController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
