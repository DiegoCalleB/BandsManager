---
id: src_utils_midiExport
title: "src/utils/midiExport.ts"
layer: service
domain: system
file: "src/utils/midiExport.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/midiExport.ts

> **Ubicación:** `src/utils/midiExport.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exportador a MIDI (Standard MIDI File tipo 0) de las ideas que compone la IA.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_musicTheory|src/utils/musicTheory.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_chatbot_hooks_useChatAudioGeneration|src/components/chatbot/hooks/useChatAudioGeneration.ts]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/midiExport.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
