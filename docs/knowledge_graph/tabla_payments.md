---
id: tabla_payments
title: "tabla payments"
layer: schema
domain: finances
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla payments

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/finances`

## 📖 Descripción
Tabla de Supabase `payments` (10 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[db_payments|Pagos y suscripciones (Stripe)]] *(from #db)*
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `tipo`
- `categoria`
- `concepto`
- `importe`
- `fecha`
- `estado`
- `created_at`
- `updated_at`

**Definida en:** `supabase_schema.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
