---
id: src_components_repertorio_SongTransitionPreviewModal
title: "src/components/repertorio/SongTransitionPreviewModal.tsx"
layer: frontend
domain: repertoire
file: "src/components/repertorio/SongTransitionPreviewModal.tsx"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/repertorio/SongTransitionPreviewModal.tsx

> **Ubicación:** `src/components/repertorio/SongTransitionPreviewModal.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Comprobación de la unión entre dos temas del repertorio: escucharla, diagnosticarla y ajustarla.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_repertorio_song_transition_SongTransitionProvider|src/components/repertorio/song_transition/SongTransitionProvider.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_song_transition_SongTransitionView|src/components/repertorio/song_transition/SongTransitionView.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_song_transition_hooks_useSongTransitionController|src/components/repertorio/song_transition/hooks/useSongTransitionController.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_song_transition_types|src/components/repertorio/song_transition/types.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_RepertorioModalsContainer|src/components/repertorio/RepertorioModalsContainer.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/repertorio/song_transition/__tests__/songTransitionContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
