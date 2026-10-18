---
id: server_services_avisarEmailsDudosos
title: "server/services/avisarEmailsDudosos.ts"
layer: service
domain: system
file: "server/services/avisarEmailsDudosos.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/avisarEmailsDudosos.ts

> **Ubicación:** `server/services/avisarEmailsDudosos.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Un email que ha aportado una IA o un buscador no es un hecho: se comprueba que su dominio existe (registros MX o A).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_emailValidator|server/utils/emailValidator.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_procedenciaDatos|server/utils/procedenciaDatos.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_scout|Scout Discovery Agent]] *(from #agent)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/avisarEmailsDudosos.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
