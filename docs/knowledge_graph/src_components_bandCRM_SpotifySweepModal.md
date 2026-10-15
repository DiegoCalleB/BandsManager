---
id: src_components_bandCRM_SpotifySweepModal
title: "src/components/bandCRM/SpotifySweepModal.tsx"
layer: frontend
domain: booking
file: "src/components/bandCRM/SpotifySweepModal.tsx"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/bandCRM/SpotifySweepModal.tsx

> **Ubicación:** `src/components/bandCRM/SpotifySweepModal.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Exporta: SpotifySweepModal.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_bandMusic|server/routes/bandMusic.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_common_ModalPortal|src/components/common/ModalPortal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_bandCRM_BandCrmModalsHost|src/components/bandCRM/BandCrmModalsHost.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
