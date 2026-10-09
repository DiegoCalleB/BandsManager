---
id: server_routes_leads_simulation
title: "server/routes/leads/simulation.ts"
layer: route
domain: booking
file: "server/routes/leads/simulation.ts"
tags: ["route", "booking", "auto"]
---

# 📌 server/routes/leads/simulation.ts

> **Ubicación:** `server/routes/leads/simulation.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/booking`

## 📖 Descripción
Generación de emails simulados para la simulación de booking.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_leads|server/routes/leads.ts]] *(from #route)*
- [[src_components_booking_BookingSimulationModal|src/components/booking/BookingSimulationModal.tsx]] *(from #frontend)*
- [[src_hooks_useNegotiationSimulation|src/hooks/useNegotiationSimulation.ts]] *(from #hook)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
