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
- [[util_calendar_conflicts|Detector de choques del calendario]] *(Layer: #service, Domain: #booking)*
- [[db_calendar_conflicts|Persistencia de avisos de choque]] *(Layer: #db, Domain: #booking)*
- [[route_calendar_conflicts|GET /api/calendar/conflicts]] *(Layer: #route, Domain: #booking)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_calendar_conflicts|GET /api/calendar/conflicts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
