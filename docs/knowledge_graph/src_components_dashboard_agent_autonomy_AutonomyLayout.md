---
id: src_components_dashboard_agent_autonomy_AutonomyLayout
title: "src/components/dashboard/agent_autonomy/AutonomyLayout.tsx"
layer: agent
domain: system
file: "src/components/dashboard/agent_autonomy/AutonomyLayout.tsx"
tags: ["agent", "system", "auto"]
---

# 📌 src/components/dashboard/agent_autonomy/AutonomyLayout.tsx

> **Ubicación:** `src/components/dashboard/agent_autonomy/AutonomyLayout.tsx`  
> **Capa:** `#layer/agent` | **Dominio:** `#domain/system`

## 📖 Descripción
Maqueta del modal: portal, cabecera, pestañas, cuerpo y pie.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_common_ModalPortal|src/components/common/ModalPortal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_dashboard_agent_autonomy_AgentAutonomyContext|src/components/dashboard/agent_autonomy/AgentAutonomyContext.ts]] *(Layer: #agent, Domain: #system)*
- [[src_components_dashboard_agent_autonomy_AuditTab|src/components/dashboard/agent_autonomy/AuditTab.tsx]] *(Layer: #agent, Domain: #system)*
- [[src_components_dashboard_agent_autonomy_AutonomyFooter|src/components/dashboard/agent_autonomy/AutonomyFooter.tsx]] *(Layer: #agent, Domain: #system)*
- [[src_components_dashboard_agent_autonomy_AutonomyHeader|src/components/dashboard/agent_autonomy/AutonomyHeader.tsx]] *(Layer: #agent, Domain: #system)*
- [[src_components_dashboard_agent_autonomy_AutonomyRedLinesTab|src/components/dashboard/agent_autonomy/AutonomyRedLinesTab.tsx]] *(Layer: #agent, Domain: #system)*
- [[src_components_dashboard_agent_autonomy_AutonomyTabNav|src/components/dashboard/agent_autonomy/AutonomyTabNav.tsx]] *(Layer: #agent, Domain: #system)*
- [[src_components_dashboard_agent_autonomy_EmailDispatchTab|src/components/dashboard/agent_autonomy/EmailDispatchTab.tsx]] *(Layer: #agent, Domain: #system)*
- [[src_components_dashboard_agent_autonomy_ReadOnlyBanner|src/components/dashboard/agent_autonomy/ReadOnlyBanner.tsx]] *(Layer: #agent, Domain: #system)*
- [[src_components_dashboard_agent_autonomy_ResponseStrategiesTab|src/components/dashboard/agent_autonomy/ResponseStrategiesTab.tsx]] *(Layer: #agent, Domain: #system)*
- [[src_components_dashboard_agent_autonomy_SchedulesTab|src/components/dashboard/agent_autonomy/SchedulesTab.tsx]] *(Layer: #agent, Domain: #system)*
- [[src_components_dashboard_agent_autonomy_ToneIdentityTab|src/components/dashboard/agent_autonomy/ToneIdentityTab.tsx]] *(Layer: #agent, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_dashboard_AgentAutonomySettingsModal|src/components/dashboard/AgentAutonomySettingsModal.tsx]] *(from #agent)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
