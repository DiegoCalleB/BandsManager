---
id: src_components_song_studio_SongStudioLayout
title: "src/components/song_studio/SongStudioLayout.tsx"
layer: frontend
domain: repertoire
file: "src/components/song_studio/SongStudioLayout.tsx"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/song_studio/SongStudioLayout.tsx

> **Ubicación:** `src/components/song_studio/SongStudioLayout.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Maquetación del estudio: fondo modal, cuenta atrás, tarjeta (cabecera, cuerpo, mini-transporte) y diálogos

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_common_ModalPortal|src/components/common/ModalPortal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_song_studio_SongStudioContentBody|src/components/song_studio/SongStudioContentBody.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioContext|src/components/song_studio/SongStudioContext.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioDialogs|src/components/song_studio/SongStudioDialogs.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioHeader|src/components/song_studio/SongStudioHeader.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioMiniTransport|src/components/song_studio/SongStudioMiniTransport.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_SongStudioModal|src/components/SongStudioModal.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
