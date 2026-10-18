---
id: src_components_repertorio_LiveConcertToAlbumModal
title: "src/components/repertorio/LiveConcertToAlbumModal.tsx"
layer: frontend
domain: system
file: "src/components/repertorio/LiveConcertToAlbumModal.tsx"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/repertorio/LiveConcertToAlbumModal.tsx

> **Ubicación:** `src/components/repertorio/LiveConcertToAlbumModal.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Modal "Concierto en directo → álbum": orquesta controlador, contexto y maqueta.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_repertorio_live_concert_album_LiveConcertAlbumLayout|src/components/repertorio/live_concert_album/LiveConcertAlbumLayout.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_live_concert_album_LiveConcertAlbumProvider|src/components/repertorio/live_concert_album/LiveConcertAlbumProvider.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_live_concert_album_hooks_useLiveConcertAlbumController|src/components/repertorio/live_concert_album/hooks/useLiveConcertAlbumController.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_live_concert_album_types|src/components/repertorio/live_concert_album/types.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_DiscografiaView|src/components/repertorio/DiscografiaView.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/repertorio/live_concert_album/__tests__/liveConcertAlbumContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
