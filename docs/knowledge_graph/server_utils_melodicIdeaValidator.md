---
id: server_utils_melodicIdeaValidator
title: "server/utils/melodicIdeaValidator.ts"
layer: service
domain: system
file: "server/utils/melodicIdeaValidator.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/melodicIdeaValidator.ts

> **Ubicación:** `server/utils/melodicIdeaValidator.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Validador y reparador de las secuencias de notas que compone Gemini para 'propose_melodic_idea'

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_musicTheory|src/utils/musicTheory.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_chat|server/routes/chat.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
