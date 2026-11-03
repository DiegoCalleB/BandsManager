---
id: server_routes_masterMarketingDigital
title: "server/routes/masterMarketingDigital.ts"
layer: route
domain: system
file: "server/routes/masterMarketingDigital.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/masterMarketingDigital.ts

> **Ubicación:** `server/routes/masterMarketingDigital.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Web estática del Máster de Marketing Digital (carpeta aparte: master-marketing-digital/web). No es parte del TFM de

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[server_routes_paginaConcierto|server/routes/paginaConcierto.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/masterMarketingDigital.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
