---
id: server_evals_lectorGolden
title: "server/evals/lectorGolden.ts"
layer: service
domain: system
file: "server/evals/lectorGolden.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/evals/lectorGolden.ts

> **Ubicación:** `server/evals/lectorGolden.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Banco de evaluación del Lector: respuestas reales de salas (anonimizadas) con la clasificación que debería salir.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[agent_redactor|Agente Redactor (borradores de respuesta)]] *(Layer: #agent, Domain: #booking)*
- [[server_utils_respuestaEntrante|server/utils/respuestaEntrante.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🧪 Tests que lo cubren
- `server/evals/__tests__/lectorGolden.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
