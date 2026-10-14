---
id: server_db_reelClips
title: "server/db/reelClips.ts"
layer: db
domain: social
file: "server/db/reelClips.ts"
tags: ["db", "social", "auto"]
---

# 📌 server/db/reelClips.ts

> **Ubicación:** `server/db/reelClips.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/social`

## 📖 Descripción
Procedencia de los clips renderizados: de qué vídeo sale cada uno y si sus derechos son de la banda.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_utils_controlCalidadClip|server/utils/controlCalidadClip.ts]] *(Layer: #service, Domain: #system)*
- [[tabla_reel_clips|tabla reel_clips]] *(Layer: #schema, Domain: #social)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_reels_social|Reels y redes sociales]] *(from #feature)*
- [[server_services_clipNovedades|server/services/clipNovedades.ts]] *(from #service)*
- [[server_services_socialPublisher|server/services/socialPublisher.ts]] *(from #service)*
- [[server_utils_derechosClip|server/utils/derechosClip.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
