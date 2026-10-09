---
id: src_components_SongStudioModal
title: "src/components/SongStudioModal.tsx"
layer: frontend
domain: repertoire
file: "src/components/SongStudioModal.tsx"
tags: ["frontend", "repertoire", "auto", "pantalla"]
---

# 📌 src/components/SongStudioModal.tsx

> **Ubicación:** `src/components/SongStudioModal.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Punto de entrada de Song Studio. Solo cablea: el controlador compone el estado y la lógica,

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_song_studio_SongStudioLayout|src/components/song_studio/SongStudioLayout.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioProvider|src/components/song_studio/SongStudioProvider.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_hooks_useSongStudioController|src/components/song_studio/hooks/useSongStudioController.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_ideaTracks|src/components/song_studio/ideaTracks.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_moisesStems|src/components/song_studio/moisesStems.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_iris_estudio|Estudio de canción e Iris (stems)]] *(from #feature)*
- [[src_App|src/App.tsx]] *(from #frontend)*
- [[src_components_repertorio_RepertorioModalsContainer|src/components/repertorio/RepertorioModalsContainer.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/song_studio/__tests__/songStudioModulesContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
