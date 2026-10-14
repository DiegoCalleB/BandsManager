---
id: server_utils_placesPhoto
title: "server/utils/placesPhoto.ts"
layer: service
domain: system
file: "server/utils/placesPhoto.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/placesPhoto.ts

> **Ubicación:** `server/utils/placesPhoto.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Fotos de Google Places sin exponer la API key.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_leads_placesPhoto|server/routes/leads/placesPhoto.ts]] *(Layer: #route, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_agent|server/routes/agent.ts]] *(from #agent)*
- [[server_routes_leads_places|server/routes/leads/places.ts]] *(from #route)*
- [[server_routes_leads_placesPhoto|server/routes/leads/placesPhoto.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/placesPhoto.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
