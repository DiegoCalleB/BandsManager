---
id: src_components_booking_crm_hooks_useLeadEditing
title: "src/components/booking/crm/hooks/useLeadEditing.ts"
layer: frontend
domain: booking
file: "src/components/booking/crm/hooks/useLeadEditing.ts"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/crm/hooks/useLeadEditing.ts

> **Ubicación:** `src/components/booking/crm/hooks/useLeadEditing.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Edición del pitch y de la ficha de un lead, rechazo, ventanas auxiliares y disparo del enviador.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_agent|server/routes/agent.ts]] *(Layer: #agent, Domain: #system)*
- [[src_components_booking_crm_crmTypes|src/components/booking/crm/crmTypes.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_duplicateLeads|src/utils/duplicateLeads.ts]] *(Layer: #service, Domain: #booking)*
- [[src_utils_errorMessage|src/utils/errorMessage.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_crm_hooks_useBookingCrmController|src/components/booking/crm/hooks/useBookingCrmController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
