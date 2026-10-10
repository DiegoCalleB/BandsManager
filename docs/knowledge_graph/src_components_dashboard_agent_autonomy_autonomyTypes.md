---
id: src_components_dashboard_agent_autonomy_autonomyTypes
title: "src/components/dashboard/agent_autonomy/autonomyTypes.tsx"
layer: agent
domain: system
file: "src/components/dashboard/agent_autonomy/autonomyTypes.tsx"
tags: ["agent", "system", "auto"]
---

# 📌 src/components/dashboard/agent_autonomy/autonomyTypes.tsx

> **Ubicación:** `src/components/dashboard/agent_autonomy/autonomyTypes.tsx`  
> **Capa:** `#layer/agent` | **Dominio:** `#domain/system`

## 📖 Descripción
Tipos y constantes de la configuración de autonomía de los agentes (zonas horarias, días, horas, niveles).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_agent|server/routes/agent.ts]] *(Layer: #agent, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_dashboard_agent_autonomy_AgentAutonomyContext|src/components/dashboard/agent_autonomy/AgentAutonomyContext.ts]] *(from #agent)*
- [[src_components_dashboard_agent_autonomy_EconomicParamsSection|src/components/dashboard/agent_autonomy/EconomicParamsSection.tsx]] *(from #agent)*
- [[src_components_dashboard_agent_autonomy_hooks_useAgentAutonomyController|src/components/dashboard/agent_autonomy/hooks/useAgentAutonomyController.ts]] *(from #agent)*
- [[src_components_dashboard_agent_autonomy_hooks_useAutonomyAuditLogs|src/components/dashboard/agent_autonomy/hooks/useAutonomyAuditLogs.ts]] *(from #agent)*
- [[src_components_dashboard_agent_autonomy_hooks_useAutonomyConfig|src/components/dashboard/agent_autonomy/hooks/useAutonomyConfig.ts]] *(from #agent)*
- [[src_components_dashboard_agent_autonomy_hooks_useResponseStrategies|src/components/dashboard/agent_autonomy/hooks/useResponseStrategies.ts]] *(from #agent)*
- [[src_components_dashboard_agent_autonomy_ResponseStrategiesTab|src/components/dashboard/agent_autonomy/ResponseStrategiesTab.tsx]] *(from #agent)*
- [[src_components_dashboard_agent_autonomy_SenderScheduleSection|src/components/dashboard/agent_autonomy/SenderScheduleSection.tsx]] *(from #agent)*
- [[src_components_dashboard_agent_autonomy_TimezoneSelector|src/components/dashboard/agent_autonomy/TimezoneSelector.tsx]] *(from #agent)*
- [[src_components_dashboard_AgentAutonomySettingsModal|src/components/dashboard/AgentAutonomySettingsModal.tsx]] *(from #agent)*

---

## 🧪 Tests que lo cubren
- `src/components/dashboard/agent_autonomy/__tests__/agentAutonomyContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
