---
id: service_calendar_conflicts
title: "Avisos de choques por email"
layer: service
domain: booking
file: "server/services/calendarConflictService.ts"
tags: ["calendar", "email", "scheduler"]
---

# 📌 Avisos de choques por email

> **Ubicación:** `server/services/calendarConflictService.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/booking`

## 📖 Descripción
Revisión con debounce de 20 s tras guardar eventos y barrido diario. Un email por (usuario, huella); los líderes reciben texto redactado.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_calendar_conflicts|Persistencia de avisos de choque]] *(Layer: #db, Domain: #booking)*
- [[route_calendar_conflicts|GET /api/calendar/conflicts]] *(Layer: #route, Domain: #booking)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_alertSettings|server/db/alertSettings.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_services_transactionalEmail|server/services/transactionalEmail.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_errorTracking|server/utils/errorTracking.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_html|server/utils/html.ts]] *(Layer: #service, Domain: #system)*
- [[util_calendar_conflicts|Detector de choques del calendario]] *(Layer: #service, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_calendar_conflicts|GET /api/calendar/conflicts]] *(from #route)*
- [[server|server.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/calendarConflictService.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
