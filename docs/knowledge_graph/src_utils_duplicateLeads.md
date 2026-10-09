---
id: src_utils_duplicateLeads
title: "src/utils/duplicateLeads.ts"
layer: service
domain: booking
file: "src/utils/duplicateLeads.ts"
tags: ["service", "booking", "auto"]
---

# 📌 src/utils/duplicateLeads.ts

> **Ubicación:** `src/utils/duplicateLeads.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/booking`

## 📖 Descripción
Exporta: normalizeText, normalizeVenueName, normalizeEmail, normalizeWebOrHandle, stringSimilarity, DuplicateMatchReason, DuplicateGroup, calculateLeadCompletenessScore.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_LeadDuplicatesModal|src/components/booking/LeadDuplicatesModal.tsx]] *(from #frontend)*
- [[ui_booking_crm|Booking CRM Component]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
