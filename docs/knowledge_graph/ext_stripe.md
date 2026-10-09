---
id: ext_stripe
title: "Stripe"
layer: external
domain: system
file: "servicio externo"
tags: ["external", "auto"]
---

# 📌 Stripe

> **Ubicación:** `servicio externo`  
> **Capa:** `#layer/external` | **Dominio:** `#domain/system`

## 📖 Descripción
Cobros, suscripciones y planes.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_finanzas_planes|Finanzas, merchan y planes]] *(from #feature)*
- [[server_routes_billing|server/routes/billing.ts]] *(from #route)*
- [[server_routes_donations|server/routes/donations.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
