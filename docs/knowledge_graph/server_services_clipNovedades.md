---
id: server_services_clipNovedades
title: "server/services/clipNovedades.ts"
layer: service
domain: system
file: "server/services/clipNovedades.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/clipNovedades.ts

> **Ubicación:** `server/services/clipNovedades.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Pasos de /cut-video-clip que salieron del render clásico: cierre de loop, rótulo de enganche

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_reelClips|server/db/reelClips.ts]] *(Layer: #db, Domain: #social)*
- [[server_utils_audioEnergy|server/utils/audioEnergy.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_clipFiltros|server/utils/clipFiltros.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_derechosClip|server/utils/derechosClip.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_hookRotulo|server/utils/hookRotulo.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_loopPerfecto|server/utils/loopPerfecto.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_reels|server/routes/reels.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
