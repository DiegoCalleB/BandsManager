---
id: server_routes_transposeRoute
title: "server/routes/transposeRoute.ts"
layer: route
domain: system
file: "server/routes/transposeRoute.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/transposeRoute.ts

> **Ubicación:** `server/routes/transposeRoute.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Transposición de audio (`/transpose-audio`).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_services_audioTransposeService|server/services/audioTransposeService.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server|server.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
