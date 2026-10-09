---
id: server_routes_tracking
title: "server/routes/tracking.ts"
layer: route
domain: system
file: "server/routes/tracking.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/tracking.ts

> **Ubicación:** `server/routes/tracking.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Seguimiento público de emails y EPK (apertura, clic, PDF, interacción) y webhook de Resend. Solo

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_sync|server/db/sync.ts]] *(Layer: #db, Domain: #system)*
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_utils_trackingSeguro|server/utils/trackingSeguro.ts]] *(Layer: #service, Domain: #system)*
- [[tabla_epk_configs|tabla epk_configs]] *(Layer: #schema, Domain: #epk)*
- [[tabla_lead_messages|tabla lead_messages]] *(Layer: #schema, Domain: #booking)*
- [[tabla_leads|tabla leads]] *(Layer: #schema, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_acceso_sesion|Acceso y sesión]] *(from #feature)*
- [[fn_agentes_correo|Agentes de correo]] *(from #feature)*
- [[fn_fans_epk|Fans y EPK]] *(from #feature)*
- [[server|server.ts]] *(from #route)*
- [[server_routes_epk_fans|server/routes/epk_fans.ts]] *(from #route)*
- [[server_utils_emailTemplate|server/utils/emailTemplate.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/trackingSeguridad.test.ts`
- `server/routes/__tests__/trackingWebhooks.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
