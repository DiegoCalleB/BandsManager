---
id: server_routes_cartelria
title: "server/routes/cartelria.ts"
layer: route
domain: system
file: "server/routes/cartelria.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/cartelria.ts

> **Ubicación:** `server/routes/cartelria.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Cartelería: fondo de un cartel de concierto generado con IA.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_concerts|server/db/concerts.ts]] *(Layer: #db, Domain: #system)*
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_services_imagenCartel|server/services/imagenCartel.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_bandProfile|server/utils/bandProfile.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_errorTracking|server/utils/errorTracking.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_promptCartel|server/utils/promptCartel.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_trackingSeguro|server/utils/trackingSeguro.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[server_routes_campanaConcierto|server/routes/campanaConcierto.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/cartelria.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
