---
id: src_components_dashboard_agent_autonomy_AgentAutonomyContext
title: "src/components/dashboard/agent_autonomy/AgentAutonomyContext.ts"
layer: agent
domain: system
file: "src/components/dashboard/agent_autonomy/AgentAutonomyContext.ts"
tags: ["agent", "system", "auto"]
---

# 📌 src/components/dashboard/agent_autonomy/AgentAutonomyContext.ts

> **Ubicación:** `src/components/dashboard/agent_autonomy/AgentAutonomyContext.ts`  
> **Capa:** `#layer/agent` | **Dominio:** `#domain/system`

## 📖 Descripción
Contexto de la configuración de autonomía de agentes: reparte estado y acciones del controlador a las vistas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_dashboard_agent_autonomy_autonomyTypes|src/components/dashboard/agent_autonomy/autonomyTypes.tsx]] *(Layer: #agent, Domain: #system)*
- [[src_components_dashboard_agent_autonomy_hooks_useAgentAutonomyController|src/components/dashboard/agent_autonomy/hooks/useAgentAutonomyController.ts]] *(Layer: #agent, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_dashboard_agent_autonomy_AgentAutonomyProvider|src/components/dashboard/agent_autonomy/AgentAutonomyProvider.tsx]] *(from #agent)*
- [[src_components_dashboard_agent_autonomy_AgentStatusMonitor|src/components/dashboard/agent_autonomy/AgentStatusMonitor.tsx]] *(from #agent)*
- [[src_components_dashboard_agent_autonomy_AuditTab|src/components/dashboard/agent_autonomy/AuditTab.tsx]] *(from #agent)*
- [[src_components_dashboard_agent_autonomy_AutonomyFooter|src/components/dashboard/agent_autonomy/AutonomyFooter.tsx]] *(from #agent)*
- [[src_components_dashboard_agent_autonomy_AutonomyHeader|src/components/dashboard/agent_autonomy/AutonomyHeader.tsx]] *(from #agent)*
- [[src_components_dashboard_agent_autonomy_AutonomyLayout|src/components/dashboard/agent_autonomy/AutonomyLayout.tsx]] *(from #agent)*
- [[src_components_dashboard_agent_autonomy_AutonomyRedLinesTab|src/components/dashboard/agent_autonomy/AutonomyRedLinesTab.tsx]] *(from #agent)*
- [[src_components_dashboard_agent_autonomy_AutonomyTabNav|src/components/dashboard/agent_autonomy/AutonomyTabNav.tsx]] *(from #agent)*
- [[src_components_dashboard_agent_autonomy_DispatchModeSection|src/components/dashboard/agent_autonomy/DispatchModeSection.tsx]] *(from #agent)*
- [[src_components_dashboard_agent_autonomy_EconomicParamsSection|src/components/dashboard/agent_autonomy/EconomicParamsSection.tsx]] *(from #agent)*
- [[src_components_dashboard_agent_autonomy_EmailDispatchTab|src/components/dashboard/agent_autonomy/EmailDispatchTab.tsx]] *(from #agent)*
- [[src_components_dashboard_agent_autonomy_NegotiationScopeSection|src/components/dashboard/agent_autonomy/NegotiationScopeSection.tsx]] *(from #agent)*
- [[src_components_dashboard_agent_autonomy_ReadOnlyBanner|src/components/dashboard/agent_autonomy/ReadOnlyBanner.tsx]] *(from #agent)*
- [[src_components_dashboard_agent_autonomy_RedLineNotice|src/components/dashboard/agent_autonomy/RedLineNotice.tsx]] *(from #agent)*
- [[src_components_dashboard_agent_autonomy_ResponseStrategiesTab|src/components/dashboard/agent_autonomy/ResponseStrategiesTab.tsx]] *(from #agent)*
- [[src_components_dashboard_agent_autonomy_SchedulePresetsBar|src/components/dashboard/agent_autonomy/SchedulePresetsBar.tsx]] *(from #agent)*
- [[src_components_dashboard_agent_autonomy_SchedulesTab|src/components/dashboard/agent_autonomy/SchedulesTab.tsx]] *(from #agent)*
- [[src_components_dashboard_agent_autonomy_SenderScheduleSection|src/components/dashboard/agent_autonomy/SenderScheduleSection.tsx]] *(from #agent)*
- [[src_components_dashboard_agent_autonomy_StartupChecklistCard|src/components/dashboard/agent_autonomy/StartupChecklistCard.tsx]] *(from #agent)*
- [[src_components_dashboard_agent_autonomy_TimezoneSelector|src/components/dashboard/agent_autonomy/TimezoneSelector.tsx]] *(from #agent)*
- [[src_components_dashboard_agent_autonomy_ToneIdentityTab|src/components/dashboard/agent_autonomy/ToneIdentityTab.tsx]] *(from #agent)*

---

## 🧪 Tests que lo cubren
- `src/components/dashboard/agent_autonomy/__tests__/agentAutonomyContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
