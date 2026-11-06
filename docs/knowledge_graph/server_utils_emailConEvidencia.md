---
id: server_utils_emailConEvidencia
title: "server/utils/emailConEvidencia.ts"
layer: service
domain: system
file: "server/utils/emailConEvidencia.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/emailConEvidencia.ts

> **Ubicación:** `server/utils/emailConEvidencia.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Un email solo vale si hay evidencia de que es real: aparece literalmente en una página de la propia sala

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_emailValidator|server/utils/emailValidator.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_scoutLeads|server/utils/scoutLeads.ts]] *(Layer: #service, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_scout|Scout Discovery Agent]] *(from #agent)*
- [[server_services_emailsSinEvidencia|server/services/emailsSinEvidencia.ts]] *(from #service)*
- [[server_utils_emailsEnPropuestasDeChat|server/utils/emailsEnPropuestasDeChat.ts]] *(from #service)*
- [[server_utils_planAuditoriaEmails|server/utils/planAuditoriaEmails.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/emailsSinEvidencia.test.ts`
- `server/utils/__tests__/emailConEvidencia.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
