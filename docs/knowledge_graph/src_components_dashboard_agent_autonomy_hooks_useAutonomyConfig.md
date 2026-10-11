---
id: src_components_dashboard_agent_autonomy_hooks_useAutonomyConfig
title: "src/components/dashboard/agent_autonomy/hooks/useAutonomyConfig.ts"
layer: agent
domain: system
file: "src/components/dashboard/agent_autonomy/hooks/useAutonomyConfig.ts"
tags: ["agent", "system", "auto"]
---

# 📌 src/components/dashboard/agent_autonomy/hooks/useAutonomyConfig.ts

> **Ubicación:** `src/components/dashboard/agent_autonomy/hooks/useAutonomyConfig.ts`  
> **Capa:** `#layer/agent` | **Dominio:** `#domain/system`

## 📖 Descripción
Carga, edición, presets y guardado de la configuración de autonomía de los agentes.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_leads_templates|server/routes/leads/templates.ts]] *(Layer: #route, Domain: #booking)*
- [[src_components_dashboard_agent_autonomy_autonomyTypes|src/components/dashboard/agent_autonomy/autonomyTypes.tsx]] *(Layer: #agent, Domain: #system)*
- [[src_components_dashboard_agent_autonomy_responseTypes|src/components/dashboard/agent_autonomy/responseTypes.tsx]] *(Layer: #agent, Domain: #system)*
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_dashboard_agent_autonomy_hooks_useAgentAutonomyController|src/components/dashboard/agent_autonomy/hooks/useAgentAutonomyController.ts]] *(from #agent)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
