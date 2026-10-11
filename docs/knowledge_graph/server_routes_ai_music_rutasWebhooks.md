---
id: server_routes_ai_music_rutasWebhooks
title: "server/routes/ai_music/rutasWebhooks.ts"
layer: route
domain: system
file: "server/routes/ai_music/rutasWebhooks.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/ai_music/rutasWebhooks.ts

> **Ubicación:** `server/routes/ai_music/rutasWebhooks.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Webhooks de los proveedores de stems. Replicate se autentica por firma HMAC (y es idempotente); el de

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_services_stemPredictionReconciler|server/services/stemPredictionReconciler.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_iris_estudio|Estudio de canción e Iris (stems)]] *(from #feature)*
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
