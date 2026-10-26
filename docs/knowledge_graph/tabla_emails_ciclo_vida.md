---
id: tabla_emails_ciclo_vida
title: "tabla emails_ciclo_vida"
layer: schema
domain: system
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla emails_ciclo_vida

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `emails_ciclo_vida` (3 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_users|tabla users]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_emailsCicloVida|server/db/emailsCicloVida.ts]] *(from #db)*

---

## 🗄️ Columnas
- `user_id`
- `tipo`
- `enviado_en`

**Definida en:** `supabase_schema.sql`, `supabase/migrations/20261103_emails_ciclo_vida.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
