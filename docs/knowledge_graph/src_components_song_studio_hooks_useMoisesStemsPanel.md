---
id: src_components_song_studio_hooks_useMoisesStemsPanel
title: "src/components/song_studio/hooks/useMoisesStemsPanel.ts"
layer: frontend
domain: repertoire
file: "src/components/song_studio/hooks/useMoisesStemsPanel.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/song_studio/hooks/useMoisesStemsPanel.ts

> **Ubicación:** `src/components/song_studio/hooks/useMoisesStemsPanel.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Estado del panel de Iris/Moisés: motor, preset, stems elegidos, pestaña y apertura automática desde el atajo

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_song_studio_moisesStems|src/components/song_studio/moisesStems.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_irisTracks|src/utils/irisTracks.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_song_studio_hooks_useSongStudioController|src/components/song_studio/hooks/useSongStudioController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
