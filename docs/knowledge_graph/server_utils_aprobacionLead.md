---
id: server_utils_aprobacionLead
title: "server/utils/aprobacionLead.ts"
layer: service
domain: booking
file: "server/utils/aprobacionLead.ts"
tags: ["service", "booking", "auto"]
---

# 📌 server/utils/aprobacionLead.ts

> **Ubicación:** `server/utils/aprobacionLead.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/booking`

## 📖 Descripción
Constancia de la aprobación humana de un correo (AGENTS.md §3).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_enviador|Enviador Agent (Dispatcher)]] *(from #agent)*
- [[server_db_leadAprobacion|server/db/leadAprobacion.ts]] *(from #db)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/leadsAprobacionSello.test.ts`
- `server/services/__tests__/agentEngine.test.ts`
- `server/services/__tests__/agentEngineDirectSend.test.ts`
- `server/services/__tests__/agentEngineSeguridad.test.ts`
- `server/utils/__tests__/aprobacionLead.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
