---
id: tabla_pitch_vector_store
title: "tabla pitch_vector_store"
layer: schema
domain: booking
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla pitch_vector_store

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/booking`

## 📖 Descripción
Tabla de Supabase `pitch_vector_store` (14 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_leads|tabla leads]] *(Layer: #schema, Domain: #booking)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_agentes_correo|Agentes de correo]] *(from #feature)*
- [[fn_booking_crm|Booking CRM y pitch]] *(from #feature)*
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_services_pitchVectorStore|server/services/pitchVectorStore.ts]] *(from #service)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `lead_id`
- `nombre_sala`
- `tipo_entidad`
- `ciudad`
- `genero_musical`
- `texto_pitch`
- `embedding`
- `resultado_respuesta`
- `conversion_score`
- `metadata`
- `created_at`
- `updated_at`

**Definida en:** `supabase_schema.sql`, `supabase/migrations/20260922_add_pgvector_pitch_store.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
