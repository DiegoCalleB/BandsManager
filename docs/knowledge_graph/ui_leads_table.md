---
id: ui_leads_table
title: "Leads Table & Actions"
layer: frontend
domain: booking
file: "src/components/booking/LeadsTable.tsx"
tags: ["ui", "booking", "table"]
---

# 📌 Leads Table & Actions

> **Ubicación:** `src/components/booking/LeadsTable.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Tabla interactiva de salas con estados CRM y acciones masivas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[hook_booking_pipeline|useBookingPipeline Hook]] *(Layer: #hook, Domain: #booking)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[src_components_booking_ChangeLeadImageModal|src/components/booking/ChangeLeadImageModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_EmailDeliveryTicks|src/components/booking/EmailDeliveryTicks.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_LeadAvatar|src/components/booking/LeadAvatar.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_LeadHealthBadge|src/components/booking/LeadHealthBadge.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_common_FavoriteButton|src/components/common/FavoriteButton.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_common_ReliabilityBadge|src/components/common/ReliabilityBadge.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_common_VerifiedBadge|src/components/common/VerifiedBadge.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_hooks_useEmailValidation|src/hooks/useEmailValidation.ts]] *(Layer: #hook, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_bookingFollowup|src/utils/bookingFollowup.ts]] *(Layer: #service, Domain: #booking)*
- [[src_utils_bookingTourContext|src/utils/bookingTourContext.ts]] *(Layer: #service, Domain: #booking)*
- [[src_utils_leadReliability|src/utils/leadReliability.ts]] *(Layer: #service, Domain: #booking)*
- [[src_utils_whatsapp|src/utils/whatsapp.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_booking_crm|Booking CRM Component]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
