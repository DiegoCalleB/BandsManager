---
id: src_utils_subidaConProgreso
title: "src/utils/subidaConProgreso.ts"
layer: service
domain: system
file: "src/utils/subidaConProgreso.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/subidaConProgreso.ts

> **Ubicación:** `src/utils/subidaConProgreso.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Envío de un FormData con progreso real de subida. `fetch` no expone cuántos bytes han salido, y un

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_BarraProgresoSubida|src/components/repertorio/BarraProgresoSubida.tsx]] *(from #frontend)*
- [[src_components_repertorio_BulkAlbumAudioUploaderModal|src/components/repertorio/BulkAlbumAudioUploaderModal.tsx]] *(from #frontend)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/subidaConProgreso.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
