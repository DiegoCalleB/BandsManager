---
id: server_routes_concerts
title: "server/routes/concerts.ts"
layer: route
domain: system
file: "server/routes/concerts.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/concerts.ts

> **Ubicación:** `server/routes/concerts.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Conciertos y ensayos: CRUD de `/concerts` y `/rehearsals`. Capa de

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_routes_concerts|server/routes/concerts.ts]] *(Layer: #route, Domain: #system)*
- [[server_services_calendarConflictService|server/services/calendarConflictService.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_asistente_ia|Asistente de IA (chat)]] *(from #feature)*
- [[fn_booking_crm|Booking CRM y pitch]] *(from #feature)*
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[fn_finanzas_planes|Finanzas, merchan y planes]] *(from #feature)*
- [[fn_reels_social|Reels y redes sociales]] *(from #feature)*
- [[server|server.ts]] *(from #route)*
- [[server_routes_concerts|server/routes/concerts.ts]] *(from #route)*
- [[src_components_calendar_useCalendarConflicts|src/components/calendar/useCalendarConflicts.ts]] *(from #frontend)*
- [[src_components_CalendarView|src/components/CalendarView.tsx]] *(from #frontend)*
- [[src_components_Chatbot|src/components/Chatbot.tsx]] *(from #frontend)*
- [[src_components_Finanzas|src/components/Finanzas.tsx]] *(from #frontend)*
- [[src_components_ReelsCenter|src/components/ReelsCenter.tsx]] *(from #frontend)*
- [[src_services_api|src/services/api.ts]] *(from #service)*
- [[ui_venue_detail|Venue Detail & Pitch Simulator]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/firmaDeFeed.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
