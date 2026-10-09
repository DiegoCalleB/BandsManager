---
id: src_components_repertorio_hooks_useRepertorioDialogs
title: "src/components/repertorio/hooks/useRepertorioDialogs.ts"
layer: frontend
domain: system
file: "src/components/repertorio/hooks/useRepertorioDialogs.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/repertorio/hooks/useRepertorioDialogs.ts

> **Ubicación:** `src/components/repertorio/hooks/useRepertorioDialogs.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Estado de diálogos del repertorio (borrado, álbum, setlist, asignación, item de show) y sincronización de canciones editadas desde acordes o estudio.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_repertoire|Repertoire & Setlists Route]] *(Layer: #route, Domain: #repertoire)*
- [[src_components_repertorio_ConfirmDeleteAlbumModal|src/components/repertorio/ConfirmDeleteAlbumModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
