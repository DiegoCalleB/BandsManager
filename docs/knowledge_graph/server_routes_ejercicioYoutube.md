---
id: server_routes_ejercicioYoutube
title: "server/routes/ejercicioYoutube.ts"
layer: route
domain: system
file: "server/routes/ejercicioYoutube.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/ejercicioYoutube.ts

> **Ubicación:** `server/routes/ejercicioYoutube.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Página estática del ejercicio de YouTube («CRM para bandas»): /ejercicio_youtube_crm sin extensión.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[server_routes_paginaConcierto|server/routes/paginaConcierto.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/ejercicioYoutube.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
