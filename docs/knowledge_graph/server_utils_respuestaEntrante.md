---
id: server_utils_respuestaEntrante
title: "server/utils/respuestaEntrante.ts"
layer: service
domain: system
file: "server/utils/respuestaEntrante.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/respuestaEntrante.ts

> **Ubicación:** `server/utils/respuestaEntrante.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Limpieza de los correos entrantes antes de clasificarlos (Agente Lector).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_lector|Lector Agent (Listener)]] *(from #agent)*
- [[server_evals_lectorGolden|server/evals/lectorGolden.ts]] *(from #service)*
- [[server_services_emailAgentClient|server/services/emailAgentClient.ts]] *(from #agent)*
- [[server_services_gmailApiClient|server/services/gmailApiClient.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/respuestaEntrante.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
