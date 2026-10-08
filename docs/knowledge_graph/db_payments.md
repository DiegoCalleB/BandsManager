---
id: db_payments
title: "Pagos y suscripciones (Stripe)"
layer: db
domain: finances
file: "server/db/payments.ts"
tags: ["db", "billing", "stripe"]
---

# 📌 Pagos y suscripciones (Stripe)

> **Ubicación:** `server/db/payments.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/finances`

## 📖 Descripción
Persistencia de pagos y suscripciones. Facturación desactivada en producción (ver BACKLOG).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[schema_supabase|Supabase PostgreSQL Schema]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(from #security)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
