---
id: server_services_audioSeparator_FalAiService
title: "server/services/audioSeparator/FalAiService.ts"
layer: service
domain: repertoire
file: "server/services/audioSeparator/FalAiService.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 server/services/audioSeparator/FalAiService.ts

> **Ubicación:** `server/services/audioSeparator/FalAiService.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: ACTIVE_FAL_KEY, FalAiService.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(Layer: #route, Domain: #system)*
- [[server_services_audioSeparator_AudioSeparatorService|server/services/audioSeparator/AudioSeparatorService.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(from #route)*
- [[server_services_audioSeparator_AudioSeparatorFactory|server/services/audioSeparator/AudioSeparatorFactory.ts]] *(from #service)*
- [[server_services_audioSeparator_index|server/services/audioSeparator/index.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
