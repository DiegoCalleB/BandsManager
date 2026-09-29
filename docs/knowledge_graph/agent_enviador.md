---
id: agent_enviador
title: "Enviador Agent (Dispatcher)"
layer: agent
domain: booking
file: "server/services/agentEngine.ts"
tags: ["agent", "dispatcher", "human-in-the-loop"]
---

# 📌 Enviador Agent (Dispatcher)

> **Ubicación:** `server/services/agentEngine.ts`  
> **Capa:** `#layer/agent` | **Dominio:** `#domain/booking`

## 📖 Descripción
Despacha correos únicamente tras aprobación humana (aprobado_propuesta/respuesta).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_lead_messages|Lead Messages & Thread DB]] *(Layer: #db, Domain: #booking)*
- [[db_leads|Leads DB Handlers]] *(Layer: #db, Domain: #booking)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_scheduler|Agent Scheduler In-Process]] *(from #agent)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
