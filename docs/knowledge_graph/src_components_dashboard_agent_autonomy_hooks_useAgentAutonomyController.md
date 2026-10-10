---
id: src_components_dashboard_agent_autonomy_hooks_useAgentAutonomyController
title: "src/components/dashboard/agent_autonomy/hooks/useAgentAutonomyController.ts"
layer: agent
domain: system
file: "src/components/dashboard/agent_autonomy/hooks/useAgentAutonomyController.ts"
tags: ["agent", "system", "auto"]
---

# 📌 src/components/dashboard/agent_autonomy/hooks/useAgentAutonomyController.ts

> **Ubicación:** `src/components/dashboard/agent_autonomy/hooks/useAgentAutonomyController.ts`  
> **Capa:** `#layer/agent` | **Dominio:** `#domain/system`

## 📖 Descripción
Compone los hooks de auditoría, estrategias de respuesta y configuración de autonomía de los agentes.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_dashboard_agent_autonomy_autonomyTypes|src/components/dashboard/agent_autonomy/autonomyTypes.tsx]] *(Layer: #agent, Domain: #system)*
- [[src_components_dashboard_agent_autonomy_hooks_useAutonomyAuditLogs|src/components/dashboard/agent_autonomy/hooks/useAutonomyAuditLogs.ts]] *(Layer: #agent, Domain: #system)*
- [[src_components_dashboard_agent_autonomy_hooks_useAutonomyConfig|src/components/dashboard/agent_autonomy/hooks/useAutonomyConfig.ts]] *(Layer: #agent, Domain: #system)*
- [[src_components_dashboard_agent_autonomy_hooks_useResponseStrategies|src/components/dashboard/agent_autonomy/hooks/useResponseStrategies.ts]] *(Layer: #agent, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_dashboard_agent_autonomy_AgentAutonomyContext|src/components/dashboard/agent_autonomy/AgentAutonomyContext.ts]] *(from #agent)*
- [[src_components_dashboard_AgentAutonomySettingsModal|src/components/dashboard/AgentAutonomySettingsModal.tsx]] *(from #agent)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
