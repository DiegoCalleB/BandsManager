---
id: src_utils_managerAlerts
title: "src/utils/managerAlerts.ts"
layer: service
domain: system
file: "src/utils/managerAlerts.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/managerAlerts.ts

> **Ubicación:** `src/utils/managerAlerts.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: AlertAction, ManagerAlert, generateManagerAlerts.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_planPermissions|src/utils/planPermissions.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_tourRouting|src/utils/tourRouting.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_Dashboard|src/components/Dashboard.tsx]] *(from #frontend)*
- [[src_components_dashboard_ManagerAlertsWidget|src/components/dashboard/ManagerAlertsWidget.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
