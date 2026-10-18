---
id: server_db_salasCatalogo
title: "server/db/salasCatalogo.ts"
layer: db
domain: system
file: "server/db/salasCatalogo.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/salasCatalogo.ts

> **Ubicación:** `server/db/salasCatalogo.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Catálogo compartido de salas (`salas_catalogo`): adaptador de Supabase del puerto de server/services/catalogoSalas.ts.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_services_catalogoSalas|server/services/catalogoSalas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_salaCatalogo|server/utils/salaCatalogo.ts]] *(Layer: #service, Domain: #system)*
- [[tabla_leads|tabla leads]] *(Layer: #schema, Domain: #booking)*
- [[tabla_salas_catalogo|tabla salas_catalogo]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_asistente_ia|Asistente de IA (chat)]] *(from #feature)*
- [[fn_booking_crm|Booking CRM y pitch]] *(from #feature)*
- [[fn_scout_salas|Búsqueda de salas y festivales]] *(from #feature)*
- [[server_db_consultaCatalogoSupabase|server/db/consultaCatalogoSupabase.ts]] *(from #db)*
- [[server_routes_catalogo|server/routes/catalogo.ts]] *(from #route)*
- [[server_services_catalogoScheduler|server/services/catalogoScheduler.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/db/__tests__/salasCatalogo.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
