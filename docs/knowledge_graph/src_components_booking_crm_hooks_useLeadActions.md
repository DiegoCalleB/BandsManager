---
id: src_components_booking_crm_hooks_useLeadActions
title: "src/components/booking/crm/hooks/useLeadActions.ts"
layer: frontend
domain: booking
file: "src/components/booking/crm/hooks/useLeadActions.ts"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/crm/hooks/useLeadActions.ts

> **Ubicación:** `src/components/booking/crm/hooks/useLeadActions.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Acciones sobre un lead: abrir, editar, borrar, aprobar, rechazar, corregir estado, email manual y respuesta simulada.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_bookingUtils|src/utils/bookingUtils.ts]] *(Layer: #service, Domain: #booking)*
- [[src_utils_leadStatusPresentation|src/utils/leadStatusPresentation.ts]] *(Layer: #service, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_crm_hooks_useBookingCrmController|src/components/booking/crm/hooks/useBookingCrmController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
