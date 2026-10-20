---
id: server_routes_cartelria
title: "server/routes/cartelria.ts"
layer: route
domain: system
file: "server/routes/cartelria.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/cartelria.ts

> **Ubicación:** `server/routes/cartelria.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Cartelería: el cartel de un bolo.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_cartelEstilo|server/db/cartelEstilo.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_concerts|server/db/concerts.ts]] *(Layer: #db, Domain: #system)*
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_routes_upload|server/routes/upload.ts]] *(Layer: #route, Domain: #system)*
- [[server_services_briefCartel|server/services/briefCartel.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_imagenCartel|server/services/imagenCartel.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_referenciasCartel|server/services/referenciasCartel.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_bandProfile|server/utils/bandProfile.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_cartelUrl|server/utils/cartelUrl.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_errorTracking|server/utils/errorTracking.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_paginaConcierto|server/utils/paginaConcierto.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_promptCartel|server/utils/promptCartel.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_storage|server/utils/storage.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_trackingSeguro|server/utils/trackingSeguro.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_adn|src/utils/cartel/adn.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_config|src/utils/cartel/config.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_formatos|src/utils/cartel/formatos.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_idea|src/utils/cartel/idea.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_texto|src/utils/cartel/texto.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[server_routes_campanaConcierto|server/routes/campanaConcierto.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/cartelria.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
