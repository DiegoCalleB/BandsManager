---
id: db_lead_messages
title: "Lead Messages & Thread DB"
layer: db
domain: booking
file: "server/db/leadMessages.ts"
tags: ["database", "messages", "threads"]
---

# 📌 Lead Messages & Thread DB

> **Ubicación:** `server/db/leadMessages.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/booking`

## 📖 Descripción
Registro histórico de mensajes enviados y recibidos por lead y sala.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_leads_reply|Leads Reply Route]] *(from #route)*
- [[agent_enviador|Enviador Agent (Dispatcher)]] *(from #agent)*
- [[agent_lector|Lector Agent (Listener)]] *(from #agent)*
- [[agent_redactor|Agente Redactor (borradores de respuesta)]] *(from #agent)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
