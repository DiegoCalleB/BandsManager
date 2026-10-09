---
id: server_routes_leads_emailValidation
title: "server/routes/leads/emailValidation.ts"
layer: route
domain: booking
file: "server/routes/leads/emailValidation.ts"
tags: ["route", "booking", "auto"]
---

# 📌 server/routes/leads/emailValidation.ts

> **Ubicación:** `server/routes/leads/emailValidation.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/booking`

## 📖 Descripción
Validación de emails de leads (`/validate-emails`).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_utils_emailValidator|server/utils/emailValidator.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_leads|server/routes/leads.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
