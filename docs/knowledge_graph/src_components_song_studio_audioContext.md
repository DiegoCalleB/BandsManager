---
id: src_components_song_studio_audioContext
title: "src/components/song_studio/audioContext.ts"
layer: frontend
domain: repertoire
file: "src/components/song_studio/audioContext.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/song_studio/audioContext.ts

> **Ubicación:** `src/components/song_studio/audioContext.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
`window` con el constructor prefijado de Safari antiguo, sin recurrir a `any`.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_song_studio_hooks_useStudioPlaybackEngine|src/components/song_studio/hooks/useStudioPlaybackEngine.ts]] *(from #frontend)*
- [[src_components_song_studio_hooks_useTrackAudioDsp|src/components/song_studio/hooks/useTrackAudioDsp.ts]] *(from #frontend)*
- [[src_components_song_studio_hooks_useTrackOverdub|src/components/song_studio/hooks/useTrackOverdub.ts]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/song_studio/__tests__/songStudioModulesContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
