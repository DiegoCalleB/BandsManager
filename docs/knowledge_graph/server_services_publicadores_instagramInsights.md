---
id: server_services_publicadores_instagramInsights
title: "server/services/publicadores/instagramInsights.ts"
layer: service
domain: social
file: "server/services/publicadores/instagramInsights.ts"
tags: ["service", "social", "auto"]
---

# 📌 server/services/publicadores/instagramInsights.ts

> **Ubicación:** `server/services/publicadores/instagramInsights.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/social`

## 📖 Descripción
Métricas de un Reel publicado (Graph API, /{media-id}/insights) con el token de la banda.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_services_publicadores_instagramReels|server/services/publicadores/instagramReels.ts]] *(Layer: #service, Domain: #social)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_metricasReels|server/services/metricasReels.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/publicadores/__tests__/instagramInsights.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
