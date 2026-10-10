---
id: src_components_dashboard_AgentAutonomySettingsModal
title: "src/components/dashboard/AgentAutonomySettingsModal.tsx"
layer: agent
domain: system
file: "src/components/dashboard/AgentAutonomySettingsModal.tsx"
tags: ["agent", "system", "auto"]
---

# 📌 src/components/dashboard/AgentAutonomySettingsModal.tsx

> **Ubicación:** `src/components/dashboard/AgentAutonomySettingsModal.tsx`  
> **Capa:** `#layer/agent` | **Dominio:** `#domain/system`

## 📖 Descripción
Modal de autonomía de agentes: modo de envío, líneas rojas, horarios, estrategias y auditoría.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_dashboard_agent_autonomy_AgentAutonomyProvider|src/components/dashboard/agent_autonomy/AgentAutonomyProvider.tsx]] *(Layer: #agent, Domain: #system)*
- [[src_components_dashboard_agent_autonomy_AutonomyLayout|src/components/dashboard/agent_autonomy/AutonomyLayout.tsx]] *(Layer: #agent, Domain: #system)*
- [[src_components_dashboard_agent_autonomy_autonomyTypes|src/components/dashboard/agent_autonomy/autonomyTypes.tsx]] *(Layer: #agent, Domain: #system)*
- [[src_components_dashboard_agent_autonomy_hooks_useAgentAutonomyController|src/components/dashboard/agent_autonomy/hooks/useAgentAutonomyController.ts]] *(Layer: #agent, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_Chatbot|src/components/Chatbot.tsx]] *(from #frontend)*
- [[src_components_Dashboard|src/components/Dashboard.tsx]] *(from #frontend)*
- [[src_components_UserProfileModal|src/components/UserProfileModal.tsx]] *(from #frontend)*
- [[ui_booking_crm|Booking CRM Component]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/dashboard/agent_autonomy/__tests__/agentAutonomyContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
