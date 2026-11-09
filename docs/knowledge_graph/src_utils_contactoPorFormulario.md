---
id: src_utils_contactoPorFormulario
title: "src/utils/contactoPorFormulario.ts"
layer: service
domain: system
file: "src/utils/contactoPorFormulario.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/contactoPorFormulario.ts

> **Ubicación:** `src/utils/contactoPorFormulario.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Muchos festivales y ayuntamientos no publican ningún email y solo se les puede escribir por un formulario de su web

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_enviador|Enviador Agent (Dispatcher)]] *(from #agent)*
- [[src_components_booking_leads_table_LeadRowContact|src/components/booking/leads_table/LeadRowContact.tsx]] *(from #frontend)*
- [[src_components_booking_venue_modal_VenueProfileColumn|src/components/booking/venue_modal/VenueProfileColumn.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/contactoPorFormulario.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
