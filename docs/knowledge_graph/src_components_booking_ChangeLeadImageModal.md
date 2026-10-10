---
id: src_components_booking_ChangeLeadImageModal
title: "src/components/booking/ChangeLeadImageModal.tsx"
layer: frontend
domain: booking
file: "src/components/booking/ChangeLeadImageModal.tsx"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/ChangeLeadImageModal.tsx

> **Ubicación:** `src/components/booking/ChangeLeadImageModal.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Exporta: ChangeLeadImageModal.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_leads_crud|Leads CRUD Route]] *(Layer: #route, Domain: #booking)*
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(Layer: #route, Domain: #booking)*
- [[src_components_booking_LeadAvatar|src/components/booking/LeadAvatar.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_common_ModalPortal|src/components/common/ModalPortal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_leads_table_LeadsTableView|src/components/booking/leads_table/LeadsTableView.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
