---
id: server_utils_modelosGemini
title: "server/utils/modelosGemini.ts"
layer: service
domain: system
file: "server/utils/modelosGemini.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/modelosGemini.ts

> **Ubicación:** `server/utils/modelosGemini.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
ÚNICA fuente de verdad de los modelos de IA de Google/DeepSeek que usa el servidor.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_ai|server/ai.ts]] *(from #service)*
- [[server_routes_ai_music_rutasGeneracion|server/routes/ai_music/rutasGeneracion.ts]] *(from #route)*
- [[server_routes_bands|server/routes/bands.ts]] *(from #route)*
- [[server_services_imagenCartel|server/services/imagenCartel.ts]] *(from #service)*
- [[server_services_pitchVectorStore|server/services/pitchVectorStore.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/__tests__/modelosIA.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
