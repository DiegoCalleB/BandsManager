---
id: src_components_booking_leads_table_LeadCardActions
title: "src/components/booking/leads_table/LeadCardActions.tsx"
layer: frontend
domain: booking
file: "src/components/booking/leads_table/LeadCardActions.tsx"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/leads_table/LeadCardActions.tsx

> **Ubicación:** `src/components/booking/leads_table/LeadCardActions.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Barra de acciones directas de la tarjeta: WhatsApp, Instagram, llamada, aprobar, seguimiento, ficha y borrado.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_booking_leads_table_LeadsTableContext|src/components/booking/leads_table/LeadsTableContext.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_bookingFollowup|src/utils/bookingFollowup.ts]] *(Layer: #service, Domain: #booking)*
- [[src_utils_whatsapp|src/utils/whatsapp.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_leads_table_LeadGridCard|src/components/booking/leads_table/LeadGridCard.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
