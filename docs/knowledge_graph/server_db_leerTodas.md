---
id: server_db_leerTodas
title: "server/db/leerTodas.ts"
layer: db
domain: system
file: "server/db/leerTodas.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/leerTodas.ts

> **Ubicación:** `server/db/leerTodas.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Supabase corta cada petición a 1000 filas sin avisar. Lee una consulta por páginas hasta que una venga incompleta,

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[db_leads|Leads DB Handlers]] *(from #db)*
- [[fn_agentes_correo|Agentes de correo]] *(from #feature)*
- [[fn_booking_crm|Booking CRM y pitch]] *(from #feature)*
- [[fn_scout_salas|Búsqueda de salas y festivales]] *(from #feature)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
