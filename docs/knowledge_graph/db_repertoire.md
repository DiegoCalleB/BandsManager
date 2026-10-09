---
id: db_repertoire
title: "Repertoire DB Handlers"
layer: db
domain: repertoire
file: "server/db/repertoire.ts"
tags: ["database", "repertoire"]
---

# 📌 Repertoire DB Handlers

> **Ubicación:** `server/db/repertoire.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Persistencia de canciones, pistas, energía y afinaciones.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_ffmpeg|FFmpeg]] *(Layer: #external, Domain: #system)*
- [[schema_supabase|Supabase PostgreSQL Schema]] *(Layer: #schema, Domain: #system)*
- [[server_db_bands|server/db/bands.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_services_colaLetras|server/services/colaLetras.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_audioEnergy|server/utils/audioEnergy.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_audioKey|server/utils/audioKey.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_db_seed|src/db_seed.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_irisTracks|src/utils/irisTracks.ts]] *(Layer: #service, Domain: #repertoire)*
- [[tabla_setlist_shortcuts|tabla setlist_shortcuts]] *(Layer: #schema, Domain: #repertoire)*
- [[tabla_setlists|tabla setlists]] *(Layer: #schema, Domain: #repertoire)*
- [[tabla_songs|tabla songs]] *(Layer: #schema, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_asistente_ia|Asistente de IA (chat)]] *(from #feature)*
- [[fn_booking_crm|Booking CRM y pitch]] *(from #feature)*
- [[fn_ensayos|Ensayos]] *(from #feature)*
- [[fn_fans_epk|Fans y EPK]] *(from #feature)*
- [[fn_repertorio_setlists|Repertorio y setlists]] *(from #feature)*
- [[route_repertoire|Repertoire & Setlists Route]] *(from #route)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(from #security)*
- [[server_db|server/db.ts]] *(from #db)*
- [[server_db_sync|server/db/sync.ts]] *(from #db)*
- [[server_routes_songs_structureUpload|server/routes/songs/structureUpload.ts]] *(from #route)*
- [[server_utils_enrichCoversWithoutAudio|server/utils/enrichCoversWithoutAudio.ts]] *(from #service)*
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `server/db/__tests__/pistasParaGuardar.test.ts`
- `server/db/__tests__/repertoireNotasSustitutoMerge.test.ts`
- `server/db/__tests__/stemsMetaParaGuardar.test.ts`
- `server/utils/__tests__/analisisAcordes.test.ts`
- `server/utils/__tests__/enrichCoversWithoutAudio.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
