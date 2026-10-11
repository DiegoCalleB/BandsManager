---
id: server_routes_tiposBilling
title: "server/routes/tiposBilling.ts"
layer: route
domain: finances
file: "server/routes/tiposBilling.ts"
tags: ["route", "finances", "auto"]
---

# 📌 server/routes/tiposBilling.ts

> **Ubicación:** `server/routes/tiposBilling.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/finances`

## 📖 Descripción
Tipos de facturación (billing.ts): la banda registrada con sus campos de suscripción y los

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_stripe|Stripe]] *(Layer: #external, Domain: #system)*
- [[server_stateTypes|server/stateTypes.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_finanzas_planes|Finanzas, merchan y planes]] *(from #feature)*
- [[server_routes_billing|server/routes/billing.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
