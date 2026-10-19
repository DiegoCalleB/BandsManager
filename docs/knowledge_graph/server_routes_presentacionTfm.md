---
id: server_routes_presentacionTfm
title: "server/routes/presentacionTfm.ts"
layer: route
domain: system
file: "server/routes/presentacionTfm.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/presentacionTfm.ts

> **Ubicación:** `server/routes/presentacionTfm.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Atajos públicos a la película del TFM: /presentacion_tfm y /netflix. La película es un sitio estático aparte

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[server_routes_paginaConcierto|server/routes/paginaConcierto.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/presentacionTfm.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
