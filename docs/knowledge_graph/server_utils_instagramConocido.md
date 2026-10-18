---
id: server_utils_instagramConocido
title: "server/utils/instagramConocido.ts"
layer: service
domain: social
file: "server/utils/instagramConocido.ts"
tags: ["service", "social", "auto"]
---

# 📌 server/utils/instagramConocido.ts

> **Ubicación:** `server/utils/instagramConocido.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/social`

## 📖 Descripción
Instagram de salas y festivales conocidos, sin llamar a ninguna API: primero la base local de festivales y luego

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_spanishFestivalsDB|server/utils/spanishFestivalsDB.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_urlHost|server/utils/urlHost.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_scout|Scout Discovery Agent]] *(from #agent)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/instagramConocido.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
