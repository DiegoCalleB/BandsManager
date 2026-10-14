---
id: server_routes_reelsTexto
title: "server/routes/reelsTexto.ts"
layer: route
domain: social
file: "server/routes/reelsTexto.ts"
tags: ["route", "social", "auto"]
---

# 📌 server/routes/reelsTexto.ts

> **Ubicación:** `server/routes/reelsTexto.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/social`

## 📖 Descripción
Reels · texto: lo que trabaja sobre el copy y el gancho del reel, no sobre el vídeo.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_services_copyPerfecto|server/services/copyPerfecto.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_hookDoctor|server/services/hookDoctor.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_perfilDeLaPeticion|server/services/perfilDeLaPeticion.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_auditoriaCopyReel|server/utils/auditoriaCopyReel.ts]] *(Layer: #service, Domain: #social)*
- [[server_utils_bandProfile|server/utils/bandProfile.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_errorHttp|server/utils/errorHttp.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_viralSignals|server/utils/viralSignals.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_reels_social|Reels y redes sociales]] *(from #feature)*
- [[server_routes_reels|server/routes/reels.ts]] *(from #route)*
- [[src_components_reels_center_hooks_useCopyPerfecto|src/components/reels_center/hooks/useCopyPerfecto.ts]] *(from #frontend)*
- [[src_components_reels_center_reelsApiTypes|src/components/reels_center/reelsApiTypes.ts]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/reelsTexto.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
