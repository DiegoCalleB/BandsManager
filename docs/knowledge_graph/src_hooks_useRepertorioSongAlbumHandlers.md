---
id: src_hooks_useRepertorioSongAlbumHandlers
title: "src/hooks/useRepertorioSongAlbumHandlers.ts"
layer: hook
domain: repertoire
file: "src/hooks/useRepertorioSongAlbumHandlers.ts"
tags: ["hook", "repertoire", "auto"]
---

# 📌 src/hooks/useRepertorioSongAlbumHandlers.ts

> **Ubicación:** `src/hooks/useRepertorioSongAlbumHandlers.ts`  
> **Capa:** `#layer/hook` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: UseRepertorioSongAlbumHandlersProps, useRepertorioSongAlbumHandlers.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_repertoire|Repertoire & Setlists Route]] *(Layer: #route, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_analisisAcordesCliente|src/utils/analisisAcordesCliente.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_formatSongTitle|src/utils/formatSongTitle.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_repertorioUtils|src/utils/repertorioUtils.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/hooks/__tests__/useRepertorioSongAlbumHandlers.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
