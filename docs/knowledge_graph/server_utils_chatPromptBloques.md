---
id: server_utils_chatPromptBloques
title: "server/utils/chatPromptBloques.ts"
layer: service
domain: system
file: "server/utils/chatPromptBloques.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/chatPromptBloques.ts

> **Ubicación:** `server/utils/chatPromptBloques.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: textoDeDatos, nombreEnPrompt, umbralSeguro, bloqueAutonomiaPrompt.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[sec_prompt_safety|Prompt Injection Sanitizer]] *(Layer: #security, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_chatCatalogo|server/services/chatCatalogo.ts]] *(from #service)*
- [[server_services_chatLecturas|server/services/chatLecturas.ts]] *(from #service)*
- [[server_services_chatPrompt|server/services/chatPrompt.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
