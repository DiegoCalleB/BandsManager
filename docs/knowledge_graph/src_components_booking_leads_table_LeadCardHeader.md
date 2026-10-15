---
id: src_components_booking_leads_table_LeadCardHeader
title: "src/components/booking/leads_table/LeadCardHeader.tsx"
layer: frontend
domain: booking
file: "src/components/booking/leads_table/LeadCardHeader.tsx"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/leads_table/LeadCardHeader.tsx

> **Ubicación:** `src/components/booking/leads_table/LeadCardHeader.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Cabecera de la tarjeta: selección, avatar, nombre, estado, tipo, ciudad y temperatura.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_booking_LeadAvatar|src/components/booking/LeadAvatar.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_leads_table_LeadIntentBadge|src/components/booking/leads_table/LeadIntentBadge.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_leads_table_LeadTemperatureBadge|src/components/booking/leads_table/LeadTemperatureBadge.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_leads_table_LeadTipoBadge|src/components/booking/leads_table/LeadTipoBadge.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_leads_table_LeadsTableContext|src/components/booking/leads_table/LeadsTableContext.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_common_FavoriteButton|src/components/common/FavoriteButton.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_common_VerifiedBadge|src/components/common/VerifiedBadge.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_leadReliability|src/utils/leadReliability.ts]] *(Layer: #service, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_leads_table_LeadGridCard|src/components/booking/leads_table/LeadGridCard.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
