---
id: server_services_clipArchivos
title: "server/services/clipArchivos.ts"
layer: service
domain: system
file: "server/services/clipArchivos.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/clipArchivos.ts

> **Ubicación:** `server/services/clipArchivos.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Ficheros temporales y salida de los clips renderizados, y mensajes de error de YouTube.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_reels|server/routes/reels.ts]] *(from #route)*
- [[server_services_clipNovedades|server/services/clipNovedades.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
