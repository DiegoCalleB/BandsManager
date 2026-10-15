---
id: server_routes_reelsAprendizaje
title: "server/routes/reelsAprendizaje.ts"
layer: route
domain: social
file: "server/routes/reelsAprendizaje.ts"
tags: ["route", "social", "auto"]
---

# 📌 server/routes/reelsAprendizaje.ts

> **Ubicación:** `server/routes/reelsAprendizaje.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/social`

## 📖 Descripción
Reels · aprendizaje: lo que han medido los Reels publicados de la banda y qué formato toca.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_services_metricasReels|server/services/metricasReels.ts]] *(Layer: #service, Domain: #social)*
- [[server_utils_errorHttp|server/utils/errorHttp.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_reels_social|Reels y redes sociales]] *(from #feature)*
- [[server_routes_reels|server/routes/reels.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/reelsAprendizaje.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
