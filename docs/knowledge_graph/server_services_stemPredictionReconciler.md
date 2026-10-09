---
id: server_services_stemPredictionReconciler
title: "server/services/stemPredictionReconciler.ts"
layer: service
domain: repertoire
file: "server/services/stemPredictionReconciler.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 server/services/stemPredictionReconciler.ts

> **Ubicación:** `server/services/stemPredictionReconciler.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: StemPredictionJob, ReplicateWebhookHeaders, verifyReplicateWebhook, verifyWebhookSignature, isPredictionWebhookProcessed, recordPredictionJob, reconcileStaleStemPredictions.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[sec_ssrf_guard|SSRF URL Validator]] *(Layer: #security, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(from #route)*
- [[server_services_agentQueueWorker|server/services/agentQueueWorker.ts]] *(from #agent)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
