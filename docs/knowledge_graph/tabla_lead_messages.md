---
id: tabla_lead_messages
title: "tabla lead_messages"
layer: schema
domain: booking
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla lead_messages

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/booking`

## 📖 Descripción
Tabla de Supabase `lead_messages` (22 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_enviador|Enviador Agent (Dispatcher)]] *(from #agent)*
- [[agent_lector|Lector Agent (Listener)]] *(from #agent)*
- [[db_lead_messages|Lead Messages & Thread DB]] *(from #db)*
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_routes_tracking|server/routes/tracking.ts]] *(from #route)*

---

## 🗄️ Columnas
- `id`
- `lead_id`
- `band_id`
- `fecha`
- `remitente`
- `remitente_nombre`
- `asunto`
- `mensaje`
- `created_at`
- `updated_at`
- `sentimiento`
- `sentimiento_score`
- `sentimiento_label`
- `intencion`
- `intencion_etiqueta`
- `temperatura`
- `objeciones`
- `puntos_clave`
- `resumen_ejecutivo`
- `sugerencia_estrategia`
- `analisis_ia`
- `leido`

**Definida en:** `supabase_schema.sql`, `supabase/migrations/20261009_sincronizar_esquema_auditoria.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
