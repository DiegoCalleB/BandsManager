---
id: src_components_booking_AgentQueueMonitorModal
title: "src/components/booking/AgentQueueMonitorModal.tsx"
layer: agent
domain: booking
file: "src/components/booking/AgentQueueMonitorModal.tsx"
tags: ["agent", "booking", "auto"]
---

# 📌 src/components/booking/AgentQueueMonitorModal.tsx

> **Ubicación:** `src/components/booking/AgentQueueMonitorModal.tsx`  
> **Capa:** `#layer/agent` | **Dominio:** `#domain/booking`

## 📖 Descripción
Exporta: AgentQueueMonitorModal.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_agentQueue|server/routes/agentQueue.ts]] *(Layer: #agent, Domain: #system)*
- [[src_components_common_ModalPortal|src/components/common/ModalPortal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_crm_CrmModalsHost|src/components/booking/crm/CrmModalsHost.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
