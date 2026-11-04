---
id: server_utils_medirBpm
title: "server/utils/medirBpm.ts"
layer: service
domain: system
file: "server/utils/medirBpm.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/medirBpm.ts

> **Ubicación:** `server/utils/medirBpm.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Medición del BPM de una canción a partir de los pulsos que ya sabemos sacar del audio.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_utils_bpmDeAudio|server/utils/bpmDeAudio.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/medirBpm.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
