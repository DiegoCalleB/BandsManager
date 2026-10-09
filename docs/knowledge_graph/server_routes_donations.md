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
- [[ext_stripe|Stripe]] *(Layer: #external, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_dealSupport|server/db/dealSupport.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_deals|server/db/deals.ts]] *(Layer: #db, Domain: #system)*
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_routes_billing|server/routes/billing.ts]] *(Layer: #route, Domain: #finances)*
- [[server_utils_dealSupport|server/utils/dealSupport.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_finanzas_planes|Finanzas, merchan y planes]] *(from #feature)*
- [[server|server.ts]] *(from #route)*
- [[src_components_booking_DealSupportCard|src/components/booking/DealSupportCard.tsx]] *(from #frontend)*
- [[src_hooks_useApoyableDeals|src/hooks/useApoyableDeals.ts]] *(from #hook)*
- [[src_services_api|src/services/api.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/donations.test.ts`
- `server/routes/__tests__/donationsDealSupport.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
