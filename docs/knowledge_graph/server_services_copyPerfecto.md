---
id: server_services_copyPerfecto
title: "server/services/copyPerfecto.ts"
layer: service
domain: system
file: "server/services/copyPerfecto.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/copyPerfecto.ts

> **Ubicación:** `server/services/copyPerfecto.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Copy perfecto de un Reel (Fase 3 del plan): generar → auditar → juzgar → elegir.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[sec_prompt_safety|Prompt Injection Sanitizer]] *(Layer: #security, Domain: #system)*
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_auditoriaCopyReel|server/utils/auditoriaCopyReel.ts]] *(Layer: #service, Domain: #social)*
- [[server_utils_bandProfile|server/utils/bandProfile.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_reelStrategy|server/utils/reelStrategy.ts]] *(Layer: #service, Domain: #social)*
- [[server_utils_reelsCore|server/utils/reelsCore.ts]] *(Layer: #service, Domain: #social)*
- [[server_utils_valoresIA|server/utils/valoresIA.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_viralSignals|server/utils/viralSignals.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/copyPerfecto.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
