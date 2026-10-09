---
id: db_ai_ledger
title: "AI Token Ledger"
layer: db
domain: system
file: "server/db/aiLedger.ts"
tags: ["database", "ledger", "tokens", "cost-control"]
---

# 📌 AI Token Ledger

> **Ubicación:** `server/db/aiLedger.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Contabilidad exacta de tokens consumidos por banda y modelo para control de costes.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(Layer: #schema, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[tabla_ai_token_ledger|tabla ai_token_ledger]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_asistente_ia|Asistente de IA (chat)]] *(from #feature)*
- [[fn_booking_crm|Booking CRM y pitch]] *(from #feature)*
- [[fn_iris_estudio|Estudio de canción e Iris (stems)]] *(from #feature)*
- [[route_leads_pitch|Leads Pitch Generation Route]] *(from #route)*
- [[server_ai|server/ai.ts]] *(from #service)*
- [[server_db|server/db.ts]] *(from #db)*
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(from #route)*
- [[service_pitch_engine|Pitch Engine & Multi-Model Routing]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/db/__tests__/aiLedger.test.ts`
- `server/db/__tests__/aiLedgerBatch.test.ts`
- `server/db/__tests__/aiLedgerSimulation.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
