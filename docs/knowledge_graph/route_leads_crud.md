---
id: route_leads_crud
title: "Leads CRUD Route"
layer: route
domain: booking
file: "server/routes/leads/crud.ts"
tags: ["api", "route", "leads"]
---

# 📌 Leads CRUD Route

> **Ubicación:** `server/routes/leads/crud.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/booking`

## 📖 Descripción
Endpoints REST para creación, actualización y filtrado de salas por banda.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[db_leads|Leads DB Handlers]] *(Layer: #db, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[hook_booking_pipeline|useBookingPipeline Hook]] *(from #hook)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
