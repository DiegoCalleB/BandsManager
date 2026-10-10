---
id: src_hooks_useEmailTemplates
title: "src/hooks/useEmailTemplates.ts"
layer: hook
domain: system
file: "src/hooks/useEmailTemplates.ts"
tags: ["hook", "system", "auto"]
---

# 📌 src/hooks/useEmailTemplates.ts

> **Ubicación:** `src/hooks/useEmailTemplates.ts`  
> **Capa:** `#layer/hook` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: TemplateCategory, useEmailTemplates.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_leads_templates|server/routes/leads/templates.ts]] *(Layer: #route, Domain: #booking)*
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_crm_hooks_useLeadSelectionAndTemplates|src/components/booking/crm/hooks/useLeadSelectionAndTemplates.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
