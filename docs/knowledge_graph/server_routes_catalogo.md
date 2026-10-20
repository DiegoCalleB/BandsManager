---
id: server_routes_catalogo
title: "server/routes/catalogo.ts"
layer: route
domain: system
file: "server/routes/catalogo.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/catalogo.ts

> **Ubicación:** `server/routes/catalogo.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Catálogo compartido de salas: consulta, sugerencias para una banda nueva y alta en la agenda de la banda. Solo lectura del catálogo; lo que escribe es

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_consultaCatalogoSupabase|server/db/consultaCatalogoSupabase.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_salasCatalogo|server/db/salasCatalogo.ts]] *(Layer: #db, Domain: #system)*
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_services_consultaCatalogo|server/services/consultaCatalogo.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_festivalesPublicos|server/services/festivalesPublicos.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_consultaCatalogo|server/utils/consultaCatalogo.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_errorHttp|server/utils/errorHttp.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_festivalesCatalogo|server/utils/festivalesCatalogo.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_planLimits|server/utils/planLimits.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_agentes_correo|Agentes de correo]] *(from #feature)*
- [[fn_asistente_ia|Asistente de IA (chat)]] *(from #feature)*
- [[fn_booking_crm|Booking CRM y pitch]] *(from #feature)*
- [[server_routes_leads|server/routes/leads.ts]] *(from #route)*
- [[src_services_apiCatalogo|src/services/apiCatalogo.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/catalogoRouter.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
