---
id: server_utils_reelsCore
title: "server/utils/reelsCore.ts"
layer: service
domain: social
file: "server/utils/reelsCore.ts"
tags: ["service", "social", "auto"]
---

# 📌 server/utils/reelsCore.ts

> **Ubicación:** `server/utils/reelsCore.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/social`

## 📖 Descripción
Núcleo puro del generador de Reels: parseo de tiempos, saneado de lo que devuelve la IA

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_ffmpeg|FFmpeg]] *(Layer: #external, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_reels_social|Reels y redes sociales]] *(from #feature)*
- [[server_routes_reels|server/routes/reels.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/reelsCore.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
