---
id: server_utils_bookingHabilitado
title: "server/utils/bookingHabilitado.ts"
layer: service
domain: booking
file: "server/utils/bookingHabilitado.ts"
tags: ["service", "booking", "auto"]
---

# 📌 server/utils/bookingHabilitado.ts

> **Ubicación:** `server/utils/bookingHabilitado.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/booking`

## 📖 Descripción
El booking (salas, medios, management, grupos aliados, agentes y campañas) es reservado: solo

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[server_auth|server/auth.ts]] *(Layer: #security, Domain: #auth)*
- [[server_utils_suscripcion|server/utils/suscripcion.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_scheduler|Agent Scheduler In-Process]] *(from #agent)*
- [[server|server.ts]] *(from #route)*
- [[server_routes_chat|server/routes/chat.ts]] *(from #route)*
- [[server_services_agentQueueWorker|server/services/agentQueueWorker.ts]] *(from #agent)*
- [[server_services_campaignRadarScheduler|server/services/campaignRadarScheduler.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/bookingHabilitado.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
