---
id: src_utils_crossfade
title: "src/utils/crossfade.ts"
layer: service
domain: system
file: "src/utils/crossfade.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/crossfade.ts

> **Ubicación:** `src/utils/crossfade.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Fundido cruzado real entre dos pistas de audio (fin de una canción + principio de la

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_SpotifyPlayerBar|src/components/SpotifyPlayerBar.tsx]] *(from #frontend)*
- [[src_hooks_useStagePlayer|src/hooks/useStagePlayer.ts]] *(from #hook)*
- [[src_utils_transitionAudioEngine|src/utils/transitionAudioEngine.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/crossfade.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
