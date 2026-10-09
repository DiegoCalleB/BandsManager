---
id: server_utils_musicalDna
title: "server/utils/musicalDna.ts"
layer: service
domain: system
file: "server/utils/musicalDna.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/musicalDna.ts

> **Ubicación:** `server/utils/musicalDna.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
ADN musical de la banda: perfil derivado del repertorio real (tempo, tonalidad y género

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_bandProfile|server/utils/bandProfile.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_chat|server/routes/chat.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
