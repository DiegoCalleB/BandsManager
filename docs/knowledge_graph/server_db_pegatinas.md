---
id: server_db_pegatinas
title: "server/db/pegatinas.ts"
layer: db
domain: system
file: "server/db/pegatinas.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/pegatinas.ts

> **Ubicación:** `server/db/pegatinas.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Pedidos del regalo de pegatinas (`pegatinas_pedidos`): una fila por banda.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_utils_pegatinas|server/utils/pegatinas.ts]] *(Layer: #service, Domain: #system)*
- [[tabla_pegatinas_pedidos|tabla pegatinas_pedidos]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[server_routes_pegatinas|server/routes/pegatinas.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
