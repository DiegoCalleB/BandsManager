---
id: src_components_repertorio_song_transition_hooks_useTransitionCues
title: "src/components/repertorio/song_transition/hooks/useTransitionCues.ts"
layer: frontend
domain: repertoire
file: "src/components/repertorio/song_transition/hooks/useTransitionCues.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/repertorio/song_transition/hooks/useTransitionCues.ts

> **Ubicación:** `src/components/repertorio/song_transition/hooks/useTransitionCues.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Auto-CUE: puntos de entrada y salida de cada tema, saltando silencios y aplausos de directo.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_repertorio_song_transition_types|src/components/repertorio/song_transition/types.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioCueDetector|src/utils/audioCueDetector.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_song_transition_hooks_useSongTransitionController|src/components/repertorio/song_transition/hooks/useSongTransitionController.ts]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/repertorio/song_transition/__tests__/songTransitionContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
