---
id: server_utils_errorHttp
title: "server/utils/errorHttp.ts"
layer: service
domain: system
file: "server/utils/errorHttp.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/errorHttp.ts

> **Ubicación:** `server/utils/errorHttp.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Respuestas de error seguras.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_errorTracking|server/utils/errorTracking.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server|server.ts]] *(from #route)*
- [[server_routes_ai_music_rutasEstadoStems|server/routes/ai_music/rutasEstadoStems.ts]] *(from #route)*
- [[server_routes_ai_music_rutasWebhooks|server/routes/ai_music/rutasWebhooks.ts]] *(from #route)*
- [[server_routes_billing|server/routes/billing.ts]] *(from #route)*
- [[server_routes_deals|server/routes/deals.ts]] *(from #route)*
- [[server_routes_donations|server/routes/donations.ts]] *(from #route)*
- [[server_routes_gmailOAuth|server/routes/gmailOAuth.ts]] *(from #security)*
- [[server_routes_reelsAprendizaje|server/routes/reelsAprendizaje.ts]] *(from #route)*
- [[server_routes_reelsProgramacion|server/routes/reelsProgramacion.ts]] *(from #route)*
- [[server_routes_reelsTexto|server/routes/reelsTexto.ts]] *(from #route)*
- [[server_routes_upload|server/routes/upload.ts]] *(from #route)*
- [[server_routes_users_rutasBandas|server/routes/users/rutasBandas.ts]] *(from #route)*
- [[server_routes_users_rutasMiembros|server/routes/users/rutasMiembros.ts]] *(from #route)*
- [[server_routes_users_rutasPreferencias|server/routes/users/rutasPreferencias.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/errorHttp.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
