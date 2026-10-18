---
id: server_routes_tiposCalendarioIcs
title: "server/routes/tiposCalendarioIcs.ts"
layer: route
domain: system
file: "server/routes/tiposCalendarioIcs.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/tiposCalendarioIcs.ts

> **Ubicación:** `server/routes/tiposCalendarioIcs.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Filas que mezcla el feed de calendario ICS (concerts.ts): vienen de Supabase o, si no hay nada,

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[fn_finanzas_planes|Finanzas, merchan y planes]] *(from #feature)*
- [[route_calendar_conflicts|GET /api/calendar/conflicts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
