---
id: src_components_booking_leads_table_LeadRowContact
title: "src/components/booking/leads_table/LeadRowContact.tsx"
layer: frontend
domain: booking
file: "src/components/booking/leads_table/LeadRowContact.tsx"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/leads_table/LeadRowContact.tsx

> **Ubicación:** `src/components/booking/leads_table/LeadRowContact.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Celda de contacto directo de la fila: email, teléfonos e Instagram.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_booking_leads_table_LeadsTableContext|src/components/booking/leads_table/LeadsTableContext.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_hooks_useEmailValidation|src/hooks/useEmailValidation.ts]] *(Layer: #hook, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_avisoDeEmail|src/utils/avisoDeEmail.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_leads_table_LeadTableRow|src/components/booking/leads_table/LeadTableRow.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/booking/leads_table/__tests__/LeadRowContact.aviso.test.tsx`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
