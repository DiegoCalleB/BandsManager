---
id: server_routes_epk_fans
title: "server/routes/epk_fans.ts"
layer: route
domain: epk
file: "server/routes/epk_fans.ts"
tags: ["route", "epk", "auto"]
---

# 📌 server/routes/epk_fans.ts

> **Ubicación:** `server/routes/epk_fans.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/epk`

## 📖 Descripción
EPK y captación de fans: configuración de autonomía de agentes, EPK editable/traducible, listas de

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_sync|server/db/sync.ts]] *(Layer: #db, Domain: #system)*
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_routes_tracking|server/routes/tracking.ts]] *(Layer: #route, Domain: #system)*
- [[server_utils|server/utils.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_bandHash|server/utils/bandHash.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_fanIncentive|server/utils/fanIncentive.ts]] *(Layer: #service, Domain: #social)*
- [[server_utils_planLimits|server/utils/planLimits.ts]] *(Layer: #service, Domain: #system)*
- [[src_i18n_epkTranslations|src/i18n/epkTranslations.ts]] *(Layer: #service, Domain: #epk)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_epkTraducciones|src/utils/epkTraducciones.ts]] *(Layer: #service, Domain: #epk)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
