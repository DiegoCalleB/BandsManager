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
Pasos de /cut-video-clip que salieron del render clásico: análisis del tramo (loop y pulsos),

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_reelClips|server/db/reelClips.ts]] *(Layer: #db, Domain: #social)*
- [[server_services_clipArchivos|server/services/clipArchivos.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_controlCalidad|server/services/controlCalidad.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_audioEnergy|server/utils/audioEnergy.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_audioKey|server/utils/audioKey.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_clipFiltros|server/utils/clipFiltros.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_controlCalidadClip|server/utils/controlCalidadClip.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_derechosClip|server/utils/derechosClip.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_hookRotulo|server/utils/hookRotulo.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_loopPerfecto|server/utils/loopPerfecto.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_rejillaBeats|server/utils/rejillaBeats.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_storage|server/utils/storage.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_reels|server/routes/reels.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/analizarTramo.test.ts`
- `server/services/__tests__/clipNovedades.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
