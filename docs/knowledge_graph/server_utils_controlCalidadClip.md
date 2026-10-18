---
id: server_utils_controlCalidadClip
title: "server/utils/controlCalidadClip.ts"
layer: service
domain: system
file: "server/utils/controlCalidadClip.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/controlCalidadClip.ts

> **Ubicación:** `server/utils/controlCalidadClip.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Control de calidad de un clip antes de publicarlo (Fase 6 del plan de Reels).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_ffmpeg|FFmpeg]] *(Layer: #external, Domain: #system)*
- [[server_utils_reelsCore|server/utils/reelsCore.ts]] *(Layer: #service, Domain: #social)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db_reelClips|server/db/reelClips.ts]] *(from #db)*
- [[server_services_clipNovedades|server/services/clipNovedades.ts]] *(from #service)*
- [[server_services_controlCalidad|server/services/controlCalidad.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/controlCalidadClip.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
