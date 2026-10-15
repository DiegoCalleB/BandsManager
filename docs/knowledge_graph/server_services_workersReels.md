---
id: server_services_workersReels
title: "server/services/workersReels.ts"
layer: service
domain: social
file: "server/services/workersReels.ts"
tags: ["service", "social", "auto"]
---

# 📌 server/services/workersReels.ts

> **Ubicación:** `server/services/workersReels.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/social`

## 📖 Descripción
Ciclo de vida del Reel publicado, en segundo plano: publicar a su hora (socialPublisher) y medir

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_services_metricasReels|server/services/metricasReels.ts]] *(Layer: #service, Domain: #social)*
- [[server_services_socialPublisher|server/services/socialPublisher.ts]] *(Layer: #service, Domain: #social)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server|server.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
