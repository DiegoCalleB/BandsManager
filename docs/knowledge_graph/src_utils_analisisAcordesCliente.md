---
id: src_utils_analisisAcordesCliente
title: "src/utils/analisisAcordesCliente.ts"
layer: service
domain: system
file: "src/utils/analisisAcordesCliente.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/analisisAcordesCliente.ts

> **Ubicación:** `src/utils/analisisAcordesCliente.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: analizarAcordesDelAudio, resumenAnalisisAcordes.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_repertoire|Repertoire & Setlists Route]] *(Layer: #route, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_Atril|src/components/Atril.tsx]] *(from #frontend)*
- [[src_components_repertorio_BulkAlbumAudioUploaderModal|src/components/repertorio/BulkAlbumAudioUploaderModal.tsx]] *(from #frontend)*
- [[src_hooks_useRepertorioSongAlbumHandlers|src/hooks/useRepertorioSongAlbumHandlers.ts]] *(from #hook)*
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/analisisAcordesCliente.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
