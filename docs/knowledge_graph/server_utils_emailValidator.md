---
id: server_utils_emailValidator
title: "server/utils/emailValidator.ts"
layer: service
domain: system
file: "server/utils/emailValidator.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/emailValidator.ts

> **Ubicación:** `server/utils/emailValidator.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Validación de emails con dos niveles:

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_leads_emailValidation|server/routes/leads/emailValidation.ts]] *(from #route)*
- [[server_routes_leads_templates|server/routes/leads/templates.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/emailValidator.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
