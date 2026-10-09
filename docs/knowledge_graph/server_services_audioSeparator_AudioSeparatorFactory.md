---
id: server_services_audioSeparator_AudioSeparatorFactory
title: "server/services/audioSeparator/AudioSeparatorFactory.ts"
layer: service
domain: repertoire
file: "server/services/audioSeparator/AudioSeparatorFactory.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 server/services/audioSeparator/AudioSeparatorFactory.ts

> **Ubicación:** `server/services/audioSeparator/AudioSeparatorFactory.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: SupportedEngine, AudioSeparatorFactory.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_services_audioSeparator_AudioSeparatorService|server/services/audioSeparator/AudioSeparatorService.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_services_audioSeparator_FalAiService|server/services/audioSeparator/FalAiService.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_services_audioSeparator_LalalAiService|server/services/audioSeparator/LalalAiService.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_services_audioSeparator_LocalDspService|server/services/audioSeparator/LocalDspService.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_services_audioSeparator_ReplicateService|server/services/audioSeparator/ReplicateService.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_audioSeparator_index|server/services/audioSeparator/index.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
