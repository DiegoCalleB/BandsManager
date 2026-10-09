---
id: server_services_agentIntelligence
title: "server/services/agentIntelligence.ts"
layer: agent
domain: system
file: "server/services/agentIntelligence.ts"
tags: ["agent", "system", "auto"]
---

# 📌 server/services/agentIntelligence.ts

> **Ubicación:** `server/services/agentIntelligence.ts`  
> **Capa:** `#layer/agent` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: TacticalEvaluation, MemberCrossConflict, OperationalContext, getBandOperationalContext, evaluateIncomingTactics.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_redactor|Agente Redactor (borradores de respuesta)]] *(from #agent)*
- [[server_routes_agent|server/routes/agent.ts]] *(from #agent)*
- [[service_pitch_engine|Pitch Engine & Multi-Model Routing]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
