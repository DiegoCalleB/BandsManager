---
id: src_components_song_studio_hooks_useIdeaMicRecording
title: "src/components/song_studio/hooks/useIdeaMicRecording.ts"
layer: frontend
domain: repertoire
file: "src/components/song_studio/hooks/useIdeaMicRecording.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/song_studio/hooks/useIdeaMicRecording.ts

> **Ubicación:** `src/components/song_studio/hooks/useIdeaMicRecording.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Grabación de una idea nueva con el micrófono (inicio, parada y temporizador)

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_audioLatency|src/utils/audioLatency.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_song_studio_hooks_useSongStudioController|src/components/song_studio/hooks/useSongStudioController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
