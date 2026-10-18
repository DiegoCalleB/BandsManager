---
id: server_evals_redactorGolden
title: "server/evals/redactorGolden.ts"
layer: service
domain: system
file: "server/evals/redactorGolden.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/evals/redactorGolden.ts

> **Ubicación:** `server/evals/redactorGolden.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Banco de evaluación del Redactor: pitches de ejemplo (buenos y malos) con el veredicto que debería dar la

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[sec_prompt_safety|Prompt Injection Sanitizer]] *(Layer: #security, Domain: #system)*
- [[server_utils_datosInventados|server/utils/datosInventados.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🧪 Tests que lo cubren
- `server/evals/__tests__/redactorGolden.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
