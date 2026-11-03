---
id: src_utils_ideasAudio
title: "src/utils/ideasAudio.ts"
layer: service
domain: repertoire
file: "src/utils/ideasAudio.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 src/utils/ideasAudio.ts

> **Ubicación:** `src/utils/ideasAudio.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: ORIGENES_AUDIO_SISTEMA, esIdeaDeUsuario, contarIdeasDeUsuario.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_SongCardRow|src/components/repertorio/SongCardRow.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/ideasAudio.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
