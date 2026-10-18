---
id: server_utils_procedenciaDatos
title: "server/utils/procedenciaDatos.ts"
layer: service
domain: system
file: "server/utils/procedenciaDatos.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/procedenciaDatos.ts

> **Ubicación:** `server/utils/procedenciaDatos.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Procedencia de los datos de un lead: de qué fuente salió cada campo enriquecido, cuándo y con qué confianza.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_scout|Scout Discovery Agent]] *(from #agent)*
- [[server_db_enriquecimientoLead|server/db/enriquecimientoLead.ts]] *(from #db)*
- [[server_services_avisarEmailsDudosos|server/services/avisarEmailsDudosos.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/avisarEmailsDudosos.test.ts`
- `server/utils/__tests__/procedenciaDatos.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
