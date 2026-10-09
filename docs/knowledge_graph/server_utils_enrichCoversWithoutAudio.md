---
id: server_utils_enrichCoversWithoutAudio
title: "server/utils/enrichCoversWithoutAudio.ts"
layer: service
domain: booking
file: "server/utils/enrichCoversWithoutAudio.ts"
tags: ["service", "booking", "auto"]
---

# 📌 server/utils/enrichCoversWithoutAudio.ts

> **Ubicación:** `server/utils/enrichCoversWithoutAudio.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/booking`

## 📖 Descripción
Exporta: EnrichedCoverResult, enrichMissingAudioSongsForBand.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_repertoire|Repertoire DB Handlers]] *(Layer: #db, Domain: #repertoire)*
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils|server/utils.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_repertoire|Repertoire & Setlists Route]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/enrichCoversWithoutAudio.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
