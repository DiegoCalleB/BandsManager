---
id: server_utils_programacionPosts
title: "server/utils/programacionPosts.ts"
layer: service
domain: system
file: "server/utils/programacionPosts.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/programacionPosts.ts

> **Ubicación:** `server/utils/programacionPosts.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Cuándo toca publicar un post programado.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_socialPublisher|server/services/socialPublisher.ts]] *(from #service)*
- [[server_utils_cadenciaReels|server/utils/cadenciaReels.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/programacionPosts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
