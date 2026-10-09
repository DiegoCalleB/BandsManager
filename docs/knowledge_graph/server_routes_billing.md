---
id: server_routes_billing
title: "server/routes/billing.ts"
layer: route
domain: finances
file: "server/routes/billing.ts"
tags: ["route", "finances", "auto"]
---

# 📌 server/routes/billing.ts

> **Ubicación:** `server/routes/billing.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/finances`

## 📖 Descripción
Facturación con Stripe: checkout, portal de cliente, webhook, confirmación de plan y créditos IA

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_dealSupport|server/db/dealSupport.ts]] *(Layer: #db, Domain: #system)*
- [[server_utils_email|server/utils/email.ts]] *(Layer: #service, Domain: #system)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*
- [[tabla_users|tabla users]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server|server.ts]] *(from #route)*
- [[server_routes_donations|server/routes/donations.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/billing.test.ts`
- `server/routes/__tests__/stripeWebhookFiabilidad.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
