---
id: src_hooks_useEmailValidation
title: "src/hooks/useEmailValidation.ts"
layer: hook
domain: system
file: "src/hooks/useEmailValidation.ts"
tags: ["hook", "system", "auto"]
---

# 📌 src/hooks/useEmailValidation.ts

> **Ubicación:** `src/hooks/useEmailValidation.ts`  
> **Capa:** `#layer/hook` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: useEmailValidation, getEmailStatus, isBouncedLead.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_leads_crud|Leads CRUD Route]] *(Layer: #route, Domain: #booking)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_leads_table|Leads Table & Actions]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
