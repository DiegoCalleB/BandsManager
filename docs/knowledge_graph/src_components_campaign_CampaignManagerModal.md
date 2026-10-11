---
id: src_components_campaign_CampaignManagerModal
title: "src/components/campaign/CampaignManagerModal.tsx"
layer: frontend
domain: system
file: "src/components/campaign/CampaignManagerModal.tsx"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/campaign/CampaignManagerModal.tsx

> **Ubicación:** `src/components/campaign/CampaignManagerModal.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: CampaignManagerModal.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_leads_templates|server/routes/leads/templates.ts]] *(Layer: #route, Domain: #booking)*
- [[src_components_booking_GenerateAllTemplatesModal|src/components/booking/GenerateAllTemplatesModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_common_HolidayDateWarning|src/components/common/HolidayDateWarning.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_app_lazyViews|src/app/lazyViews.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
