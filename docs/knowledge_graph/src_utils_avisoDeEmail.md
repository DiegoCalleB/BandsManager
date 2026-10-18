---
id: src_utils_avisoDeEmail
title: "src/utils/avisoDeEmail.ts"
layer: service
domain: system
file: "src/utils/avisoDeEmail.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/avisoDeEmail.ts

> **Ubicación:** `src/utils/avisoDeEmail.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Aviso «comprueba este email» de un lead: lo deja el enriquecimiento cuando un email aportado por una IA o un buscador

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_leads_table_LeadRowContact|src/components/booking/leads_table/LeadRowContact.tsx]] *(from #frontend)*
- [[src_components_booking_venue_modal_VenueProfileColumn|src/components/booking/venue_modal/VenueProfileColumn.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/booking/leads_table/__tests__/LeadRowContact.aviso.test.tsx`
- `src/utils/__tests__/avisoDeEmail.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
