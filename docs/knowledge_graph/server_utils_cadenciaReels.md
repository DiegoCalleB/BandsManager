---
id: server_utils_cadenciaReels
title: "server/utils/cadenciaReels.ts"
layer: service
domain: social
file: "server/utils/cadenciaReels.ts"
tags: ["service", "social", "auto"]
---

# 📌 server/utils/cadenciaReels.ts

> **Ubicación:** `server/utils/cadenciaReels.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/social`

## 📖 Descripción
Cadencia de publicación (Fase 4 del plan): cuándo toca el próximo Reel de una banda.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_programacionPosts|server/utils/programacionPosts.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_reelsProgramacion|server/routes/reelsProgramacion.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/cadenciaReels.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
