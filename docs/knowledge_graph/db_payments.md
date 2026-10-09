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
- [[schema_supabase|Supabase PostgreSQL Schema]] *(Layer: #schema, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_db_bands|server/db/bands.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[tabla_payments|tabla payments]] *(Layer: #schema, Domain: #finances)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_booking_crm|Booking CRM y pitch]] *(from #feature)*
- [[fn_fans_epk|Fans y EPK]] *(from #feature)*
- [[fn_finanzas_planes|Finanzas, merchan y planes]] *(from #feature)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(from #security)*
- [[server_db|server/db.ts]] *(from #db)*
- [[server_db_sync|server/db/sync.ts]] *(from #db)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
