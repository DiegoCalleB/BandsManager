---
id: src_components_booking_crm_hooks_useLeadSelectionAndTemplates
title: "src/components/booking/crm/hooks/useLeadSelectionAndTemplates.ts"
layer: frontend
domain: booking
file: "src/components/booking/crm/hooks/useLeadSelectionAndTemplates.ts"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/crm/hooks/useLeadSelectionAndTemplates.ts

> **Ubicación:** `src/components/booking/crm/hooks/useLeadSelectionAndTemplates.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Selección múltiple, envío masivo, ciudades, interacciones y plantillas del CRM.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_booking_BulkProgressModal|src/components/booking/BulkProgressModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_hooks_useCityChips|src/hooks/useCityChips.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useEmailTemplates|src/hooks/useEmailTemplates.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useGmailIntegration|src/hooks/useGmailIntegration.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useInteractionLog|src/hooks/useInteractionLog.ts]] *(Layer: #hook, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_bookingUtils|src/utils/bookingUtils.ts]] *(Layer: #service, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_crm_hooks_useBookingCrmController|src/components/booking/crm/hooks/useBookingCrmController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
