---
id: server_utils_estadoPorBanda
title: "server/utils/estadoPorBanda.ts"
layer: service
domain: system
file: "server/utils/estadoPorBanda.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/estadoPorBanda.ts

> **Ubicación:** `server/utils/estadoPorBanda.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Operaciones sobre colecciones del estado en memoria (`state.tours`, `state.fans`...) que son de

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_bands|server/routes/bands.ts]] *(from #route)*
- [[server_routes_concerts|server/routes/concerts.ts]] *(from #route)*
- [[server_routes_epk_fans|server/routes/epk_fans.ts]] *(from #route)*
- [[server_routes_metrics|server/routes/metrics.ts]] *(from #route)*
- [[server_routes_posts|server/routes/posts.ts]] *(from #route)*
- [[server_routes_spotify|server/routes/spotify.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/estadoPorBanda.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
