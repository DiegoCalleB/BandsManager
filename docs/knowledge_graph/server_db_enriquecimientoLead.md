---
id: server_db_enriquecimientoLead
title: "server/db/enriquecimientoLead.ts"
layer: db
domain: booking
file: "server/db/enriquecimientoLead.ts"
tags: ["db", "booking", "auto"]
---

# 📌 server/db/enriquecimientoLead.ts

> **Ubicación:** `server/db/enriquecimientoLead.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/booking`

## 📖 Descripción
Columnas del lead que escribe el enriquecimiento: el id de Google Maps y la procedencia de cada dato.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_procedenciaDatos|server/utils/procedenciaDatos.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[db_leads|Leads DB Handlers]] *(from #db)*
- [[fn_agentes_correo|Agentes de correo]] *(from #feature)*
- [[fn_booking_crm|Booking CRM y pitch]] *(from #feature)*
- [[fn_scout_salas|Búsqueda de salas y festivales]] *(from #feature)*

---

## 🧪 Tests que lo cubren
- `server/db/__tests__/enriquecimientoLead.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
