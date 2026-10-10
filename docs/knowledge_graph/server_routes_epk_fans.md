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
- [[tabla_fan_link_clicks|tabla fan_link_clicks]] *(Layer: #schema, Domain: #social)*
- [[tabla_leads|tabla leads]] *(Layer: #schema, Domain: #booking)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_fans_epk|Fans y EPK]] *(from #feature)*
- [[server|server.ts]] *(from #route)*
- [[src_components_fans_landing_fanLandingTypes|src/components/fans_landing/fanLandingTypes.ts]] *(from #frontend)*
- [[src_components_fans_landing_hooks_useFanBandProfile|src/components/fans_landing/hooks/useFanBandProfile.ts]] *(from #frontend)*
- [[src_components_fans_landing_hooks_useFanEngagement|src/components/fans_landing/hooks/useFanEngagement.ts]] *(from #frontend)*
- [[src_components_fans_landing_hooks_useFanSignupSubmit|src/components/fans_landing/hooks/useFanSignupSubmit.ts]] *(from #frontend)*
- [[src_components_FansPanel|src/components/FansPanel.tsx]] *(from #frontend)*
- [[src_components_PublicEPK|src/components/PublicEPK.tsx]] *(from #frontend)*
- [[src_components_PublicFanCapture|src/components/PublicFanCapture.tsx]] *(from #frontend)*
- [[src_components_PublicMusiciansLanding|src/components/PublicMusiciansLanding.tsx]] *(from #frontend)*
- [[src_services_api|src/services/api.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/auditoriaSeguridadPR2.test.ts`
- `server/routes/__tests__/seguridadAutorizacion.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
