---
id: tabla_pitch_learning_examples
title: "tabla pitch_learning_examples"
layer: schema
domain: booking
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla pitch_learning_examples

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/booking`

## 📖 Descripción
Tabla de Supabase `pitch_learning_examples` (13 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_pitchLearning|server/db/pitchLearning.ts]] *(from #db)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `lead_id`
- `nombre_sala`
- `tipo_entidad`
- `ciudad`
- `borrador_ia`
- `texto_aprobado`
- `tuvo_edicion`
- `diferencia_longitud`
- `tipo_accion`
- `resultado_respuesta`
- `fecha_aprobacion`

**Definida en:** `supabase_schema.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
