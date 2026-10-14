---
id: server_utils_redactorAlcance
title: "server/utils/redactorAlcance.ts"
layer: service
domain: system
file: "server/utils/redactorAlcance.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/redactorAlcance.ts

> **Ubicación:** `server/utils/redactorAlcance.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Qué leads puede reescribir el Agente Redactor por lotes (POST /api/trigger-agent).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_agent|server/routes/agent.ts]] *(from #agent)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/redactorAlcance.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
