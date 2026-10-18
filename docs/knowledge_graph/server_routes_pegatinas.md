---
id: server_routes_pegatinas
title: "server/routes/pegatinas.ts"
layer: route
domain: system
file: "server/routes/pegatinas.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/pegatinas.ts

> **Ubicación:** `server/routes/pegatinas.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Regalo de pegatinas en la primera suscripción de pago (solo bandas con plan de pago y cobro activo).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_db_pegatinas|server/db/pegatinas.ts]] *(Layer: #db, Domain: #system)*
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_routes_pegatinas|server/routes/pegatinas.ts]] *(Layer: #route, Domain: #system)*
- [[server_services_avisoAltas|server/services/avisoAltas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_errorTracking|server/utils/errorTracking.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_pegatinas|server/utils/pegatinas.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[server_routes_paginaConcierto|server/routes/paginaConcierto.ts]] *(from #route)*
- [[server_routes_pegatinas|server/routes/pegatinas.ts]] *(from #route)*
- [[src_components_RegaloPegatinas|src/components/RegaloPegatinas.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/pegatinas.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
