---
id: route_calendar_conflicts
title: "GET /api/calendar/conflicts"
layer: route
domain: booking
file: "server/routes/concerts.ts"
tags: ["calendar", "route"]
---

# 📌 GET /api/calendar/conflicts

> **Ubicación:** `server/routes/concerts.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/booking`

## 📖 Descripción
Devuelve los choques visibles para el usuario (ya redactados) y programa la revisión tras crear o editar conciertos y ensayos.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[util_calendar_conflicts|Detector de choques del calendario]] *(Layer: #service, Domain: #booking)*
- [[service_calendar_conflicts|Avisos de choques por email]] *(Layer: #service, Domain: #booking)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[service_calendar_conflicts|Avisos de choques por email]] *(from #service)*
- [[ui_calendar_conflicts|Avisos de choque en el calendario]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
