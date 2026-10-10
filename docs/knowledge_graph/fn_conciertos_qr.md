---
id: fn_conciertos_qr
title: "Conciertos, QR y calendario"
layer: feature
domain: booking
file: "src/components/CalendarView.tsx"
tags: ["feature", "booking", "auto"]
---

# 📌 Conciertos, QR y calendario

> **Ubicación:** `src/components/CalendarView.tsx`  
> **Capa:** `#layer/feature` | **Dominio:** `#domain/booking`

## 📖 Descripción
Bolos confirmados, calendario, página pública del concierto, QR y enlaces cortos.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_ffmpeg|FFmpeg]] *(Layer: #external, Domain: #system)*
- [[ext_resend|Resend]] *(Layer: #external, Domain: #system)*
- [[ext_supabase_storage|Supabase Storage]] *(Layer: #external, Domain: #system)*
- [[server_db_alertSettings|server/db/alertSettings.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_bands|server/db/bands.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_calendarConflicts|server/db/calendarConflicts.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_concerts|server/db/concerts.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_enlacesCortos|server/db/enlacesCortos.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_epk|server/db/epk.ts]] *(Layer: #db, Domain: #epk)*
- [[server_db_mergeWithExisting|server/db/mergeWithExisting.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_referidos|server/db/referidos.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_tolerantWrite|server/db/tolerantWrite.ts]] *(Layer: #db, Domain: #system)*
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_campanaConcierto|server/routes/campanaConcierto.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_concert_to_album|server/routes/concert_to_album.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_concerts|server/routes/concerts.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_enlacesCortos|server/routes/enlacesCortos.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_paginaConcierto|server/routes/paginaConcierto.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_upload|server/routes/upload.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_CalendarView|src/components/CalendarView.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_QrExportModal|src/components/QrExportModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[tabla_concerts|tabla concerts]] *(Layer: #schema, Domain: #system)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
