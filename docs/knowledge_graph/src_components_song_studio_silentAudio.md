---
id: src_components_song_studio_silentAudio
title: "src/components/song_studio/silentAudio.ts"
layer: frontend
domain: repertoire
file: "src/components/song_studio/silentAudio.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/song_studio/silentAudio.ts

> **Ubicación:** `src/components/song_studio/silentAudio.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
WAV de 1 muestra en silencio: permite crear un `Audio` válido cuando aún no hay URL resuelta.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_song_studio_hooks_useStudioPlaybackEngine|src/components/song_studio/hooks/useStudioPlaybackEngine.ts]] *(from #frontend)*
- [[src_components_song_studio_hooks_useTrackOverdub|src/components/song_studio/hooks/useTrackOverdub.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
