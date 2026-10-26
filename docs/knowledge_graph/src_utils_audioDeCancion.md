---
id: src_utils_audioDeCancion
title: "src/utils/audioDeCancion.ts"
layer: service
domain: repertoire
file: "src/utils/audioDeCancion.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 src/utils/audioDeCancion.ts

> **Ubicación:** `src/utils/audioDeCancion.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: idUnico, esUrlSubida, tieneAudioReal, siguientePista, conAudioNuevo, leerDuracionSegundos.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_repertorioUtils|src/utils/repertorioUtils.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_accionesDisco|src/components/repertorio/accionesDisco.ts]] *(from #frontend)*
- [[src_components_repertorio_BulkAlbumAudioUploaderModal|src/components/repertorio/BulkAlbumAudioUploaderModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_SongCardRow|src/components/repertorio/SongCardRow.tsx]] *(from #frontend)*
- [[src_hooks_useSubirAudioCancion|src/hooks/useSubirAudioCancion.ts]] *(from #hook)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/audioDeCancion.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
