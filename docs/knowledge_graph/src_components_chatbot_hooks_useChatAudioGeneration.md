---
id: src_components_chatbot_hooks_useChatAudioGeneration
title: "src/components/chatbot/hooks/useChatAudioGeneration.ts"
layer: frontend
domain: repertoire
file: "src/components/chatbot/hooks/useChatAudioGeneration.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/chatbot/hooks/useChatAudioGeneration.ts

> **Ubicación:** `src/components/chatbot/hooks/useChatAudioGeneration.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Genera, descarga y guarda en la canción los acompañamientos y las ideas melódicas propuestos.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_repertoire|Repertoire & Setlists Route]] *(Layer: #route, Domain: #repertoire)*
- [[src_components_chatbot_chatTypes|src/components/chatbot/chatTypes.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_accompanimentSynth|src/utils/accompanimentSynth.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_errorMessage|src/utils/errorMessage.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_instrumentSynth|src/utils/instrumentSynth.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_midiExport|src/utils/midiExport.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_chatbot_hooks_useChatController|src/components/chatbot/hooks/useChatController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
