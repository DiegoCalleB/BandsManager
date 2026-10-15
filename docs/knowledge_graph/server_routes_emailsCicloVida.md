---
id: server_routes_emailsCicloVida
title: "server/routes/emailsCicloVida.ts"
layer: route
domain: system
file: "server/routes/emailsCicloVida.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/emailsCicloVida.ts

> **Ubicación:** `server/routes/emailsCicloVida.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Baja de los emails de ciclo de vida: enlace firmado que llega en cada email.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_emailsCicloVida|server/db/emailsCicloVida.ts]] *(Layer: #db, Domain: #system)*
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_routes_emailsCicloVida|server/routes/emailsCicloVida.ts]] *(Layer: #route, Domain: #system)*
- [[server_utils_emailsCicloVida|server/utils/emailsCicloVida.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_errorTracking|server/utils/errorTracking.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[server_routes_emailsCicloVida|server/routes/emailsCicloVida.ts]] *(from #route)*
- [[server_routes_paginaConcierto|server/routes/paginaConcierto.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/emailsCicloVida.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
