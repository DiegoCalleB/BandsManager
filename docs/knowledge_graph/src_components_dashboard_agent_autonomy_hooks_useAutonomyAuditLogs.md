---
id: src_components_dashboard_agent_autonomy_hooks_useAutonomyAuditLogs
title: "src/components/dashboard/agent_autonomy/hooks/useAutonomyAuditLogs.ts"
layer: agent
domain: system
file: "src/components/dashboard/agent_autonomy/hooks/useAutonomyAuditLogs.ts"
tags: ["agent", "system", "auto"]
---

# 📌 src/components/dashboard/agent_autonomy/hooks/useAutonomyAuditLogs.ts

> **Ubicación:** `src/components/dashboard/agent_autonomy/hooks/useAutonomyAuditLogs.ts`  
> **Capa:** `#layer/agent` | **Dominio:** `#domain/system`

## 📖 Descripción
Registro de auditoría de acciones de los agentes: carga, filtro y exportación CSV.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_agent|server/routes/agent.ts]] *(Layer: #agent, Domain: #system)*
- [[src_components_dashboard_agent_autonomy_autonomyTypes|src/components/dashboard/agent_autonomy/autonomyTypes.tsx]] *(Layer: #agent, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_dashboard_agent_autonomy_hooks_useAgentAutonomyController|src/components/dashboard/agent_autonomy/hooks/useAgentAutonomyController.ts]] *(from #agent)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
