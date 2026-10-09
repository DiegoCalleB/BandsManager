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
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[tabla_lead_messages|tabla lead_messages]] *(Layer: #schema, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_enviador|Enviador Agent (Dispatcher)]] *(from #agent)*
- [[agent_lector|Lector Agent (Listener)]] *(from #agent)*
- [[agent_redactor|Agente Redactor (borradores de respuesta)]] *(from #agent)*
- [[fn_agentes_correo|Agentes de correo]] *(from #feature)*
- [[fn_booking_crm|Booking CRM y pitch]] *(from #feature)*
- [[route_leads_reply|Leads Reply Route]] *(from #route)*
- [[server_db|server/db.ts]] *(from #db)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
