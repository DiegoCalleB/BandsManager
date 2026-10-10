---
id: src_hooks_useSeparacionIris
title: "src/hooks/useSeparacionIris.ts"
layer: hook
domain: repertoire
file: "src/hooks/useSeparacionIris.ts"
tags: ["hook", "repertoire", "auto"]
---

# 📌 src/hooks/useSeparacionIris.ts

> **Ubicación:** `src/hooks/useSeparacionIris.ts`  
> **Capa:** `#layer/hook` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: useSeparacionIris.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(Layer: #route, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioLatency|src/utils/audioLatency.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_audioParaSubida|src/utils/audioParaSubida.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_irisTracks|src/utils/irisTracks.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_separacionIris|src/utils/separacionIris.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_stemSeparator|src/utils/stemSeparator.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_iris_estudio|Estudio de canción e Iris (stems)]] *(from #feature)*
- [[src_components_atril_hooks_useAtrilAudio|src/components/atril/hooks/useAtrilAudio.ts]] *(from #frontend)*
- [[src_components_song_studio_hooks_useAiTrackGeneration|src/components/song_studio/hooks/useAiTrackGeneration.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
