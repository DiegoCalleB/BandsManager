---
id: src_components_booking_leads_table_BotonConfirmarEmail
title: "src/components/booking/leads_table/BotonConfirmarEmail.tsx"
layer: frontend
domain: booking
file: "src/components/booking/leads_table/BotonConfirmarEmail.tsx"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/leads_table/BotonConfirmarEmail.tsx

> **Ubicación:** `src/components/booking/leads_table/BotonConfirmarEmail.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
«Confirmar»: la banda responde de un email que caducó (se leyó en la web hace más de 90 días). Un clic lo vuelve

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_booking_leads_table_LeadsTableContext|src/components/booking/leads_table/LeadsTableContext.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_confirmarEmail|src/utils/confirmarEmail.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_leads_table_LeadRowContact|src/components/booking/leads_table/LeadRowContact.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
