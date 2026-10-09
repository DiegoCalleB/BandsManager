---
id: server_routes_donations
title: "server/routes/donations.ts"
layer: route
domain: system
file: "server/routes/donations.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/donations.ts

> **Ubicación:** `server/routes/donations.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Donaciones (Stripe Checkout) y apoyo a acuerdos (`deal-support`). Con `donationRateLimiter`;

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_dealSupport|server/db/dealSupport.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_deals|server/db/deals.ts]] *(Layer: #db, Domain: #system)*
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_routes_billing|server/routes/billing.ts]] *(Layer: #route, Domain: #finances)*
- [[server_utils_dealSupport|server/utils/dealSupport.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
