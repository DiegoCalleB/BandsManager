---
id: server_db_tolerantWrite
title: "server/db/tolerantWrite.ts"
layer: db
domain: system
file: "server/db/tolerantWrite.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/tolerantWrite.ts

> **Ubicación:** `server/db/tolerantWrite.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Escritura tolerante a columnas que aún no existen.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_guardadoParcial|server/utils/guardadoParcial.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[db_leads|Leads DB Handlers]] *(from #db)*
- [[fn_agentes_correo|Agentes de correo]] *(from #feature)*
- [[fn_booking_crm|Booking CRM y pitch]] *(from #feature)*
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[fn_ensayos|Ensayos]] *(from #feature)*
- [[fn_fans_epk|Fans y EPK]] *(from #feature)*
- [[fn_finanzas_planes|Finanzas, merchan y planes]] *(from #feature)*
- [[fn_scout_salas|Búsqueda de salas y festivales]] *(from #feature)*
- [[server_db_concerts|server/db/concerts.ts]] *(from #db)*
- [[server_db_deals|server/db/deals.ts]] *(from #db)*
- [[server_db_epk|server/db/epk.ts]] *(from #db)*
- [[server_db_rehearsals|server/db/rehearsals.ts]] *(from #db)*

---

## 🧪 Tests que lo cubren
- `server/db/__tests__/tolerantWrite.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
