---
id: server_db_consultaCatalogoSupabase
title: "server/db/consultaCatalogoSupabase.ts"
layer: db
domain: system
file: "server/db/consultaCatalogoSupabase.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/consultaCatalogoSupabase.ts

> **Ubicación:** `server/db/consultaCatalogoSupabase.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Instancia única de la consulta al catálogo de salas sobre Supabase (comparte caché entre la ruta REST y el chat).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_salasCatalogo|server/db/salasCatalogo.ts]] *(Layer: #db, Domain: #system)*
- [[server_services_consultaCatalogo|server/services/consultaCatalogo.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_asistente_ia|Asistente de IA (chat)]] *(from #feature)*
- [[fn_booking_crm|Booking CRM y pitch]] *(from #feature)*
- [[server_routes_catalogo|server/routes/catalogo.ts]] *(from #route)*
- [[server_routes_chat|server/routes/chat.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
