---
id: src_utils_estadoDeContacto
title: "src/utils/estadoDeContacto.ts"
layer: service
domain: system
file: "src/utils/estadoDeContacto.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/estadoDeContacto.ts

> **Ubicación:** `src/utils/estadoDeContacto.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
¿Puede la banda escribir a este lead hoy y por dónde? Un único estado por lead, calculado con lo que ya hay

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_avisoDeEmail|src/utils/avisoDeEmail.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_contactoPorFormulario|src/utils/contactoPorFormulario.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_fiabilidadEmail|src/utils/fiabilidadEmail.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_crm_FiltroContactoChips|src/components/booking/crm/FiltroContactoChips.tsx]] *(from #frontend)*
- [[src_components_booking_crm_hooks_useBookingCrmController|src/components/booking/crm/hooks/useBookingCrmController.ts]] *(from #frontend)*
- [[src_components_booking_crm_hooks_useLeadFiltering|src/components/booking/crm/hooks/useLeadFiltering.ts]] *(from #frontend)*
- [[src_components_booking_leads_table_LeadRowContact|src/components/booking/leads_table/LeadRowContact.tsx]] *(from #frontend)*
- [[src_components_campaign_GlobalCampaignBar|src/components/campaign/GlobalCampaignBar.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/estadoDeContacto.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
