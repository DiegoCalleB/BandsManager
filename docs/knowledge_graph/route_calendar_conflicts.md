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
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[route_calendar_conflicts|GET /api/calendar/conflicts]] *(Layer: #route, Domain: #booking)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_routes_tiposCalendarioIcs|server/routes/tiposCalendarioIcs.ts]] *(Layer: #route, Domain: #system)*
- [[server_utils_errorHttp|server/utils/errorHttp.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_estadoPorBanda|server/utils/estadoPorBanda.ts]] *(Layer: #service, Domain: #system)*
- [[service_calendar_conflicts|Avisos de choques por email]] *(Layer: #service, Domain: #booking)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*
- [[util_calendar_conflicts|Detector de choques del calendario]] *(Layer: #service, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[fn_finanzas_planes|Finanzas, merchan y planes]] *(from #feature)*
- [[route_calendar_conflicts|GET /api/calendar/conflicts]] *(from #route)*
- [[server|server.ts]] *(from #route)*
- [[service_calendar_conflicts|Avisos de choques por email]] *(from #service)*
- [[src_components_booking_venue_panel_hooks_buildVenuePanelActions|src/components/booking/venue_panel/hooks/buildVenuePanelActions.ts]] *(from #frontend)*
- [[src_components_calendar_hooks_useRunOfShowAndGear|src/components/calendar/hooks/useRunOfShowAndGear.ts]] *(from #frontend)*
- [[src_components_chatbot_hooks_useEntityActions|src/components/chatbot/hooks/useEntityActions.ts]] *(from #frontend)*
- [[src_components_Finanzas|src/components/Finanzas.tsx]] *(from #frontend)*
- [[src_components_reels_center_hooks_useReelStyleOptions|src/components/reels_center/hooks/useReelStyleOptions.ts]] *(from #frontend)*
- [[src_components_reels_center_reelsApiTypes|src/components/reels_center/reelsApiTypes.ts]] *(from #frontend)*
- [[src_services_api|src/services/api.ts]] *(from #service)*
- [[ui_calendar_conflicts|Avisos de choque en el calendario]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/firmaDeFeed.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
