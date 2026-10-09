---
id: server_utils_scoutLeads
title: "server/utils/scoutLeads.ts"
layer: service
domain: booking
file: "server/utils/scoutLeads.ts"
tags: ["service", "booking", "auto"]
---

# 📌 server/utils/scoutLeads.ts

> **Ubicación:** `server/utils/scoutLeads.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/booking`

## 📖 Descripción
Validación y normalización de los recintos que devuelve la IA en el Agente Scout.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_scout|Scout Discovery Agent]] *(from #agent)*
- [[server_routes_agent|server/routes/agent.ts]] *(from #agent)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
