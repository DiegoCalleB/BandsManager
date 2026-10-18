---
id: util_calendar_conflicts
title: "Detector de choques del calendario"
layer: service
domain: booking
file: "src/utils/calendarConflicts.ts"
tags: ["calendar", "conflicts", "pure"]
---

# 📌 Detector de choques del calendario

> **Ubicación:** `src/utils/calendarConflicts.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/booking`

## 📖 Descripción
Detector puro y determinista (cliente + servidor): solapes, margen corto, viaje inviable y mismo día. Un choque exige una persona en ambos sitios. Redacta datos de otras bandas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[util_viaje_estimado|Estimador de viaje offline]] *(Layer: #service, Domain: #booking)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[service_calendar_conflicts|Avisos de choques por email]] *(from #service)*
- [[route_calendar_conflicts|GET /api/calendar/conflicts]] *(from #route)*
- [[ui_calendar_conflicts|Avisos de choque en el calendario]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
