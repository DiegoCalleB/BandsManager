---
id: server_routes_bandMusic
title: "server/routes/bandMusic.ts"
layer: route
domain: system
file: "server/routes/bandMusic.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/bandMusic.ts

> **Ubicación:** `server/routes/bandMusic.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Escucha y Spotify en lote para las bandas de la cuenta. Todo va acotado a la banda activa

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_enlacesBandas|server/db/enlacesBandas.ts]] *(Layer: #db, Domain: #system)*
- [[server_services_metricasBandaService|server/services/metricasBandaService.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_musicPreviewService|server/services/musicPreviewService.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_spotifyService|server/services/spotifyService.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_enlacesBandas|server/utils/enlacesBandas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_metricasBanda|server/utils/metricasBanda.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_spotifyMatch|server/utils/spotifyMatch.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_spotifyEmbed|src/utils/spotifyEmbed.ts]] *(Layer: #service, Domain: #system)*
- [[tabla_band_contacts|tabla band_contacts]] *(Layer: #schema, Domain: #system)*
- [[tabla_metricas_bandas_amigas|tabla metricas_bandas_amigas]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server|server.ts]] *(from #route)*
- [[src_components_BandCRM|src/components/BandCRM.tsx]] *(from #frontend)*
- [[src_components_bandCRM_SpotifySweepModal|src/components/bandCRM/SpotifySweepModal.tsx]] *(from #frontend)*
- [[src_components_booking_BandPreviewPlayer|src/components/booking/BandPreviewPlayer.tsx]] *(from #frontend)*
- [[src_components_chatbot_hooks_useEntityActions|src/components/chatbot/hooks/useEntityActions.ts]] *(from #frontend)*
- [[src_services_api|src/services/api.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
