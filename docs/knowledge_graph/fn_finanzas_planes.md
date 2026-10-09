---
id: fn_finanzas_planes
title: "Finanzas, merchan y planes"
layer: feature
domain: finances
file: "src/components/Finanzas.tsx"
tags: ["feature", "finances", "auto"]
---

# 📌 Finanzas, merchan y planes

> **Ubicación:** `src/components/Finanzas.tsx`  
> **Capa:** `#layer/feature` | **Dominio:** `#domain/finances`

## 📖 Descripción
Ingresos, gastos, merchan, donaciones, planes y cobro con Stripe.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_leads|Leads DB Handlers]] *(Layer: #db, Domain: #booking)*
- [[db_payments|Pagos y suscripciones (Stripe)]] *(Layer: #db, Domain: #finances)*
- [[ext_stripe|Stripe]] *(Layer: #external, Domain: #system)*
- [[server_db_bands|server/db/bands.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_concerts|server/db/concerts.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_dealSupport|server/db/dealSupport.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_deals|server/db/deals.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_sync|server/db/sync.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_tolerantWrite|server/db/tolerantWrite.ts]] *(Layer: #db, Domain: #system)*
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_billing|server/routes/billing.ts]] *(Layer: #route, Domain: #finances)*
- [[server_routes_concerts|server/routes/concerts.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_donations|server/routes/donations.ts]] *(Layer: #route, Domain: #system)*
- [[server_services_financialBreakEvenService|server/services/financialBreakEvenService.ts]] *(Layer: #service, Domain: #system)*
- [[src_components_CheckoutButton|src/components/CheckoutButton.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_Finanzas|src/components/Finanzas.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_Merchan|src/components/Merchan.tsx]] *(Layer: #frontend, Domain: #finances)*
- [[src_components_Planes|src/components/Planes.tsx]] *(Layer: #frontend, Domain: #system)*
- [[tabla_payments|tabla payments]] *(Layer: #schema, Domain: #finances)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*
- [[tabla_users|tabla users]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
