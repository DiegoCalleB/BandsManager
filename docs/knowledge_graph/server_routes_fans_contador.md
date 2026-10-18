---
id: server_routes_fans_contador
title: "server/routes/fans_contador.ts"
layer: route
domain: social
file: "server/routes/fans_contador.ts"
tags: ["route", "social", "auto"]
---

# 📌 server/routes/fans_contador.ts

> **Ubicación:** `server/routes/fans_contador.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/social`

## 📖 Descripción
Número de fans de una banda. La película del TFM lo consulta para saber cuándo alguien se ha hecho fan desde el QR

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_routes_fans_contador|server/routes/fans_contador.ts]] *(Layer: #route, Domain: #social)*
- [[server_utils_bandHash|server/utils/bandHash.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[server_routes_fans_contador|server/routes/fans_contador.ts]] *(from #route)*
- [[server_routes_paginaConcierto|server/routes/paginaConcierto.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
