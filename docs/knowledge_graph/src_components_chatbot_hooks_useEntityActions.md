---
id: src_components_chatbot_hooks_useEntityActions
title: "src/components/chatbot/hooks/useEntityActions.ts"
layer: frontend
domain: system
file: "src/components/chatbot/hooks/useEntityActions.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/chatbot/hooks/useEntityActions.ts

> **Ubicación:** `src/components/chatbot/hooks/useEntityActions.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Aplica las propuestas del asistente sobre estados, bandas, conciertos, ensayos, giras, logo y leads.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_bandMusic|server/routes/bandMusic.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_concerts|server/routes/concerts.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_tours|server/routes/tours.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_chatbot_chatTypes|src/components/chatbot/chatTypes.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_errorMessage|src/utils/errorMessage.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_chatbot_hooks_useChatActions|src/components/chatbot/hooks/useChatActions.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
