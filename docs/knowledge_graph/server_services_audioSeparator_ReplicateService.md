---
id: server_services_audioSeparator_ReplicateService
title: "server/services/audioSeparator/ReplicateService.ts"
layer: service
domain: repertoire
file: "server/services/audioSeparator/ReplicateService.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 server/services/audioSeparator/ReplicateService.ts

> **Ubicación:** `server/services/audioSeparator/ReplicateService.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: ReplicateService.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_replicate|Replicate]] *(Layer: #external, Domain: #system)*
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(Layer: #route, Domain: #system)*
- [[server_services_audioSeparator_AudioSeparatorService|server/services/audioSeparator/AudioSeparatorService.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_audioSeparator_AudioSeparatorFactory|server/services/audioSeparator/AudioSeparatorFactory.ts]] *(from #service)*
- [[server_services_audioSeparator_index|server/services/audioSeparator/index.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
