---
id: tabla_concert_deals
title: "tabla concert_deals"
layer: schema
domain: system
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla concert_deals

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `concert_deals` (35 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_concerts|tabla concerts]] *(Layer: #schema, Domain: #system)*
- [[tabla_leads|tabla leads]] *(Layer: #schema, Domain: #booking)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_deals|server/db/deals.ts]] *(from #db)*
- [[server_db_dealSupport|server/db/dealSupport.ts]] *(from #db)*
- [[tabla_deal_support_contributions|tabla deal_support_contributions]] *(from #schema)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `lead_id`
- `concert_id`
- `token`
- `nombre_evento`
- `lugar_sala`
- `ciudad`
- `fecha_evento`
- `hora_llegada`
- `hora_concierto`
- `tipo_remuneracion`
- `cache_base`
- `total_suplementos`
- `total_acordado`
- `porcentaje_taquilla`
- `comision_porcentaje`
- `comision_importe`
- `neto_banda`
- `apoyo_porcentaje`
- `forma_pago`
- `rider_incluido`
- `rider_texto`
- `rider_validado_por_sala`
- `hospitalidad_notas`
- `estado`
- `nombre_firmante`
- `cargo_firmante`
- `firma_imagen`
- `firma_ip`
- `firma_user_agent`
- `firma_timestamp`
- `contrato_sha256`
- `created_at`
- `updated_at`

**Definida en:** `supabase_schema.sql`, `supabase/migrations/20261005_concert_deals.sql`, `supabase/migrations/20261007_concert_deals_apoyo_porcentaje.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
