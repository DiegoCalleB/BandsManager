---
id: server_utils_auditoriaCopyReel
title: "server/utils/auditoriaCopyReel.ts"
layer: service
domain: social
file: "server/utils/auditoriaCopyReel.ts"
tags: ["service", "social", "auto"]
---

# 📌 server/utils/auditoriaCopyReel.ts

> **Ubicación:** `server/utils/auditoriaCopyReel.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/social`

## 📖 Descripción
Auditoría determinista del copy de un Reel (Fase 3 del plan): lo que se puede comprobar sin

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[sec_prompt_safety|Prompt Injection Sanitizer]] *(Layer: #security, Domain: #system)*
- [[server_utils_promptGuidelines|server/utils/promptGuidelines.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_copyPerfecto|server/services/copyPerfecto.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/auditoriaCopyReel.dorado.test.ts`
- `server/utils/__tests__/auditoriaCopyReel.test.ts`
- `server/utils/__tests__/fixtures/copyReelDorado.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
