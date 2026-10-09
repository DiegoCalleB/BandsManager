---
id: server_utils_bandProfile
title: "server/utils/bandProfile.ts"
layer: service
domain: system
file: "server/utils/bandProfile.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/bandProfile.ts

> **Ubicación:** `server/utils/bandProfile.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Perfil de banda para los prompts de IA.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_reelFeedback|server/utils/reelFeedback.ts]] *(Layer: #service, Domain: #social)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_campanaConcierto|server/routes/campanaConcierto.ts]] *(from #route)*
- [[server_routes_chat|server/routes/chat.ts]] *(from #route)*
- [[server_routes_reels|server/routes/reels.ts]] *(from #route)*
- [[server_utils_musicalDna|server/utils/musicalDna.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
