---
id: server_utils_senalesPublico
title: "server/utils/senalesPublico.ts"
layer: service
domain: system
file: "server/utils/senalesPublico.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/senalesPublico.ts

> **Ubicación:** `server/utils/senalesPublico.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Señales de público: lo que la gente ya ha demostrado que le interesa de un vídeo de YouTube.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_viralSignals|server/utils/viralSignals.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_interesDelPublico|server/services/interesDelPublico.ts]] *(from #service)*
- [[server_services_youtubeMeta|server/services/youtubeMeta.ts]] *(from #service)*
- [[server_utils_viralSignals|server/utils/viralSignals.ts]] *(from #service)*
- [[server_utils_youtubeSource|server/utils/youtubeSource.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/senalesPublico.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
