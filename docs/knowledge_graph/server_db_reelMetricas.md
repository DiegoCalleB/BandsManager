---
id: server_db_reelMetricas
title: "server/db/reelMetricas.ts"
layer: db
domain: social
file: "server/db/reelMetricas.ts"
tags: ["db", "social", "auto"]
---

# 📌 server/db/reelMetricas.ts

> **Ubicación:** `server/db/reelMetricas.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/social`

## 📖 Descripción
Métricas reales de los Reels publicados (una fila por post y medición).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_utils_aprendizajeReels|server/utils/aprendizajeReels.ts]] *(Layer: #service, Domain: #social)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[tabla_reel_metricas|tabla reel_metricas]] *(Layer: #schema, Domain: #social)*
- [[tabla_social_posts|tabla social_posts]] *(Layer: #schema, Domain: #social)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_reels_social|Reels y redes sociales]] *(from #feature)*
- [[server_services_metricasReels|server/services/metricasReels.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
