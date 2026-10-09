---
id: server_routes_leads_feedback
title: "server/routes/leads/feedback.ts"
layer: route
domain: booking
file: "server/routes/leads/feedback.ts"
tags: ["route", "booking", "auto"]
---

# 📌 server/routes/leads/feedback.ts

> **Ubicación:** `server/routes/leads/feedback.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/booking`

## 📖 Descripción
Resumen global del feedback de pitches (`getGlobalPitchFeedbackSummary`) para afinar el tono del

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_leads_pitch|Leads Pitch Generation Route]] *(from #route)*
- [[server_routes_leads|server/routes/leads.ts]] *(from #route)*
- [[server_routes_leads_templates|server/routes/leads/templates.ts]] *(from #route)*
- [[server_utils_templateOptimizer|server/utils/templateOptimizer.ts]] *(from #service)*
- [[service_pitch_engine|Pitch Engine & Multi-Model Routing]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
