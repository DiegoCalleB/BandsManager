---
id: src_components_booking_CRMContactEnricherModal
title: "src/components/booking/CRMContactEnricherModal.tsx"
layer: frontend
domain: booking
file: "src/components/booking/CRMContactEnricherModal.tsx"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/CRMContactEnricherModal.tsx

> **Ubicación:** `src/components/booking/CRMContactEnricherModal.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Exporta: CRMContactEnricherModal.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_leads_crud|Leads CRUD Route]] *(Layer: #route, Domain: #booking)*
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(Layer: #route, Domain: #booking)*
- [[src_components_booking_tiposRespuestasApi|src/components/booking/tiposRespuestasApi.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_common_ModalPortal|src/components/common/ModalPortal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_crm_CrmModalsHost|src/components/booking/crm/CrmModalsHost.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/booking/__tests__/CRMContactEnricherModal.test.tsx`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
