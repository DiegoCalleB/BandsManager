---
id: src_components_chatbot_hooks_useCatalogoActions
title: "src/components/chatbot/hooks/useCatalogoActions.ts"
layer: frontend
domain: system
file: "src/components/chatbot/hooks/useCatalogoActions.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/chatbot/hooks/useCatalogoActions.ts

> **Ubicación:** `src/components/chatbot/hooks/useCatalogoActions.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Aplica `propose_add_from_catalog`: añade una sala del catálogo compartido a la agenda de la banda.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_chatbot_chatTypes|src/components/chatbot/chatTypes.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_services_apiCatalogo|src/services/apiCatalogo.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_chatbot_hooks_useChatActions|src/components/chatbot/hooks/useChatActions.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
