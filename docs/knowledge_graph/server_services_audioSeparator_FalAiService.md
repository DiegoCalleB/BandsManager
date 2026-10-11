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
- [[ext_fal|fal.ai]] *(Layer: #external, Domain: #system)*
- [[server_routes_ai_music_audioPublico|server/routes/ai_music/audioPublico.ts]] *(Layer: #route, Domain: #repertoire)*
- [[server_services_audioSeparator_AudioSeparatorService|server/services/audioSeparator/AudioSeparatorService.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_ai_music_motoresNeuronales|server/routes/ai_music/motoresNeuronales.ts]] *(from #route)*
- [[server_routes_ai_music_rutasEstadoStems|server/routes/ai_music/rutasEstadoStems.ts]] *(from #route)*
- [[server_routes_ai_music_separacionContexto|server/routes/ai_music/separacionContexto.ts]] *(from #route)*
- [[server_services_audioSeparator_AudioSeparatorFactory|server/services/audioSeparator/AudioSeparatorFactory.ts]] *(from #service)*
- [[server_services_audioSeparator_index|server/services/audioSeparator/index.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/auditoriaSeguridadPR2.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
