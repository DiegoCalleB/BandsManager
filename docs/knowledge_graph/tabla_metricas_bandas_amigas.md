---
id: tabla_metricas_bandas_amigas
title: "tabla metricas_bandas_amigas"
layer: schema
domain: system
file: "supabase/migrations/20261020_metricas_bandas_amigas.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla metricas_bandas_amigas

> **Ubicación:** `supabase/migrations/20261020_metricas_bandas_amigas.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `metricas_bandas_amigas` (11 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_routes_bandMusic|server/routes/bandMusic.ts]] *(from #route)*
- [[server_services_metricasBandaService|server/services/metricasBandaService.ts]] *(from #service)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `band_contact_id`
- `fuente`
- `periodo`
- `seguidores`
- `fans`
- `suscriptores`
- `visualizaciones`
- `popularidad`
- `capturado_at`

**Definida en:** `supabase/migrations/20261020_metricas_bandas_amigas.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
