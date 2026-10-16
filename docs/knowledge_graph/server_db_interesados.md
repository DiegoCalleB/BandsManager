---
id: server_db_interesados
title: "server/db/interesados.ts"
layer: db
domain: system
file: "server/db/interesados.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/interesados.ts

> **Ubicación:** `server/db/interesados.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Interesados de la landing oficial en la lista de espera (`musicians_waitlist`): alta con doble

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[tabla_musicians_waitlist|tabla musicians_waitlist]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[fn_fans_epk|Fans y EPK]] *(from #feature)*
- [[server_routes_interesados|server/routes/interesados.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
