---
id: agent_lector
title: "Lector Agent (Listener)"
layer: agent
domain: booking
file: "server/services/lectorAgent.ts"
tags: ["agent", "listener", "gmail-oauth"]
---

# 📌 Lector Agent (Listener)

> **Ubicación:** `server/services/lectorAgent.ts`  
> **Capa:** `#layer/agent` | **Dominio:** `#domain/booking`

## 📖 Descripción
Monitoriza respuestas entrantes de salas vía Gmail OAuth2 / IMAP cada ~60s.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[sec_prompt_safety|Prompt Injection Sanitizer]] *(Layer: #security, Domain: #system)*
- [[db_lead_messages|Lead Messages & Thread DB]] *(Layer: #db, Domain: #booking)*
- [[db_leads|Leads DB Handlers]] *(Layer: #db, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[sec_prompt_safety|Prompt Injection Sanitizer]] *(from #security)*
- [[agent_scheduler|Agent Scheduler In-Process]] *(from #agent)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
