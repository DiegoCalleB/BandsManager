---
id: tabla_deal_support_contributions
title: "tabla deal_support_contributions"
layer: schema
domain: system
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla deal_support_contributions

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `deal_support_contributions` (8 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_concert_deals|tabla concert_deals]] *(Layer: #schema, Domain: #system)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_dealSupport|server/db/dealSupport.ts]] *(from #db)*

---

## 🗄️ Columnas
- `id`
- `deal_id`
- `band_id`
- `amount_cents`
- `stripe_payment_intent_id`
- `reembolsado_cents`
- `paid_at`
- `created_at`

**Definida en:** `supabase_schema.sql`, `supabase/migrations/20261006_deal_support_contributions.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
