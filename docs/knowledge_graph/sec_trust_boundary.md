---
id: sec_trust_boundary
title: "Trust Boundary & Band Scoping"
layer: security
domain: auth
file: "server/utils/bandAccess.ts"
tags: ["security", "trust-boundary", "multi-tenancy"]
---

# 📌 Trust Boundary & Band Scoping

> **Ubicación:** `server/utils/bandAccess.ts`  
> **Capa:** `#layer/security` | **Dominio:** `#domain/auth`

## 📖 Descripción
Resolución forzosa del band_id desde la sesión autenticada. Bloquea inyecciones en req.body.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_leads|Leads DB Handlers]] *(Layer: #db, Domain: #booking)*
- [[db_repertoire|Repertoire DB Handlers]] *(Layer: #db, Domain: #repertoire)*
- [[sec_ssrf_guard|SSRF URL Validator]] *(Layer: #security, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_leads_table|Leads Table & Actions]] *(from #frontend)*
- [[util_calendar_conflicts|Detector de choques del calendario]] *(from #service)*
- [[service_calendar_conflicts|Avisos de choques por email]] *(from #service)*
- [[route_calendar_conflicts|GET /api/calendar/conflicts]] *(from #route)*
- [[hook_booking_pipeline|useBookingPipeline Hook]] *(from #hook)*
- [[hook_app_data|useAppData Hook]] *(from #hook)*
- [[route_leads_crud|Leads CRUD Route]] *(from #route)*
- [[route_repertoire|Repertoire & Setlists Route]] *(from #route)*
- [[agent_enviador|Enviador Agent (Dispatcher)]] *(from #agent)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
