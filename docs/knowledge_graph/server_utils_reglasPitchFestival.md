---
id: server_utils_reglasPitchFestival
title: "server/utils/reglasPitchFestival.ts"
layer: service
domain: booking
file: "server/utils/reglasPitchFestival.ts"
tags: ["service", "booking", "auto"]
---

# 📌 server/utils/reglasPitchFestival.ts

> **Ubicación:** `server/utils/reglasPitchFestival.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/booking`

## 📖 Descripción
Comprueba un email de campaña contra las reglas de escritura que ya tiene el proyecto: la lista negra de muletillas de IA y

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[sec_prompt_safety|Prompt Injection Sanitizer]] *(Layer: #security, Domain: #system)*
- [[server_utils_promptGuidelines|server/utils/promptGuidelines.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asuntoDelPitch|src/utils/asuntoDelPitch.ts]] *(Layer: #service, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_prepararEmailsCampana|server/services/prepararEmailsCampana.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/reglasPitchFestival.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
