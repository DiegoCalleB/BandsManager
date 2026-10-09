---
id: server_services_stemStorageRetryQueue
title: "server/services/stemStorageRetryQueue.ts"
layer: service
domain: repertoire
file: "server/services/stemStorageRetryQueue.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 server/services/stemStorageRetryQueue.ts

> **Ubicación:** `server/services/stemStorageRetryQueue.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: PendingStemUpload, stemStorageRetryManager.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_utils_storage|server/utils/storage.ts]] *(Layer: #service, Domain: #system)*
- [[tabla_stem_storage_retry_queue|tabla stem_storage_retry_queue]] *(Layer: #schema, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(from #route)*
- [[server_services_audioSeparator_AudioSeparatorService|server/services/audioSeparator/AudioSeparatorService.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/roformerStems.test.ts`
- `server/services/__tests__/stemWebhookAndLocks.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
