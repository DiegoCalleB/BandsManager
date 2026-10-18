---
id: server_services_chatCatalogo
title: "server/services/chatCatalogo.ts"
layer: service
domain: system
file: "server/services/chatCatalogo.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/chatCatalogo.ts

> **Ubicación:** `server/services/chatCatalogo.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
El catálogo compartido de salas en el chat: una herramienta de LECTURA (`buscar_catalogo`) y una PROPUESTA

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_gemini|Gemini (Google GenAI)]] *(Layer: #external, Domain: #system)*
- [[server_utils_chatPromptBloques|server/utils/chatPromptBloques.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_consultaCatalogo|server/utils/consultaCatalogo.ts]] *(Layer: #service, Domain: #system)*
- [[src_components_chatbot_chatTypes|src/components/chatbot/chatTypes.ts]] *(Layer: #frontend, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_chatLecturas|server/services/chatLecturas.ts]] *(from #service)*
- [[server_services_chatTools|server/services/chatTools.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/chatCatalogo.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
