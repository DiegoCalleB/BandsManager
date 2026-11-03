---
id: server_utils_bpmDeAudio
title: "server/utils/bpmDeAudio.ts"
layer: service
domain: repertoire
file: "server/utils/bpmDeAudio.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 server/utils/bpmDeAudio.ts

> **Ubicación:** `server/utils/bpmDeAudio.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
BPM de una canción a partir de su audio: los pulsos de Beat This! y un ajuste fino (`bpmDesdePulsos`).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_audioKey|server/utils/audioKey.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_beatThis_beatThis|server/utils/beatThis/beatThis.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_medirBpm|server/utils/medirBpm.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[db_repertoire|Repertoire DB Handlers]] *(from #db)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
