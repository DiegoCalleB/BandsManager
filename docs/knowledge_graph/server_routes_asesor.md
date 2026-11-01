---
id: server_routes_asesor
title: "server/routes/asesor.ts"
layer: route
domain: system
file: "server/routes/asesor.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/asesor.ts

> **Ubicación:** `server/routes/asesor.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Asesor de Marketing.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_db_asesorMarketing|server/db/asesorMarketing.ts]] *(Layer: #db, Domain: #system)*
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_services_asesorInstagram|server/services/asesorInstagram.ts]] *(Layer: #service, Domain: #social)*
- [[server_services_asesorMarketing|server/services/asesorMarketing.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_asesorRedes|server/services/asesorRedes.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_errorTracking|server/utils/errorTracking.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_estrategia|src/utils/asesor/estrategia.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[server_routes_campanaConcierto|server/routes/campanaConcierto.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/asesor.test.ts`
- `server/routes/__tests__/asesorRedes.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
