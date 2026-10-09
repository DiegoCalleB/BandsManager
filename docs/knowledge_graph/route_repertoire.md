---
id: route_repertoire
title: "Repertoire & Setlists Route"
layer: route
domain: repertoire
file: "server/routes/repertorio.ts"
tags: ["api", "route", "repertoire"]
---

# 📌 Repertoire & Setlists Route

> **Ubicación:** `server/routes/repertorio.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Endpoints para canciones, compatibilidad armónica y exportación a setlist.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_repertoire|Repertoire DB Handlers]] *(Layer: #db, Domain: #repertoire)*
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_routes_concert_to_album|server/routes/concert_to_album.ts]] *(Layer: #route, Domain: #system)*
- [[server_services_acordesCancion|server/services/acordesCancion.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_colaLetras|server/services/colaLetras.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_services_letraCancion|server/services/letraCancion.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_services_profesorArmonia|server/services/profesorArmonia.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils|server/utils.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_analisisAcordes|server/utils/analisisAcordes.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_bandStyleContext|server/utils/bandStyleContext.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_bloqueoOido|server/utils/bloqueoOido.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_enrichCoversWithoutAudio|server/utils/enrichCoversWithoutAudio.ts]] *(Layer: #service, Domain: #booking)*
- [[server_utils_optimizeExistingWavs|server/utils/optimizeExistingWavs.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_perfectSetlistPlanner|server/utils/perfectSetlistPlanner.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_progresoOido|server/utils/progresoOido.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_setlistAIAnalyzer|server/utils/setlistAIAnalyzer.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_setlistFeedback|server/utils/setlistFeedback.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_setlistImport|server/utils/setlistImport.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_irisTracks|src/utils/irisTracks.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_lineaTiempoAcordes|src/utils/lineaTiempoAcordes.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_songTitleMatch|src/utils/songTitleMatch.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_teoriaArmonica|src/utils/teoriaArmonica.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server|server.ts]] *(from #route)*
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
