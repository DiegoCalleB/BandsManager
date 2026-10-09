---
id: src_components_repertorio_hooks_useRepertorioPlaybackAndModals
title: "src/components/repertorio/hooks/useRepertorioPlaybackAndModals.ts"
layer: frontend
domain: system
file: "src/components/repertorio/hooks/useRepertorioPlaybackAndModals.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/repertorio/hooks/useRepertorioPlaybackAndModals.ts

> **Ubicación:** `src/components/repertorio/hooks/useRepertorioPlaybackAndModals.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Cola de reproducción, modales de canción, estudio, acordes y transición, selección de item y arrastre del catálogo al setlist.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_repertoire|Repertoire & Setlists Route]] *(Layer: #route, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_guardarConReversion|src/utils/guardarConReversion.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
