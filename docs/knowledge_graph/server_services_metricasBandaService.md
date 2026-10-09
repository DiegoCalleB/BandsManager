---
id: server_services_metricasBandaService
title: "server/services/metricasBandaService.ts"
layer: service
domain: system
file: "server/services/metricasBandaService.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/metricasBandaService.ts

> **Ubicación:** `server/services/metricasBandaService.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Captura mensual de métricas públicas de una banda: Spotify (seguidores, popularidad) y

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_services_spotifyService|server/services/spotifyService.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_metricasBanda|server/utils/metricasBanda.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_spotifyEmbed|src/utils/spotifyEmbed.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_bandMusic|server/routes/bandMusic.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
