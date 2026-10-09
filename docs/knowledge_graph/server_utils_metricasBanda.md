---
id: server_utils_metricasBanda
title: "server/utils/metricasBanda.ts"
layer: service
domain: system
file: "server/utils/metricasBanda.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/metricasBanda.ts

> **Ubicación:** `server/utils/metricasBanda.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Lógica pura de las métricas de banda (sin red): periodo mensual y elección del canal de YouTube.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_spotifyMatch|server/utils/spotifyMatch.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_bandMusic|server/routes/bandMusic.ts]] *(from #route)*
- [[server_services_metricasBandaService|server/services/metricasBandaService.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
