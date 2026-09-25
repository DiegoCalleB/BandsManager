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

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_leads_pitch|Leads Pitch Generation Route]] *(from #route)*
- [[service_pitch_engine|Pitch Engine & Multi-Model Routing]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
