---
id: server_utils_planAuditoriaEmails
title: "server/utils/planAuditoriaEmails.ts"
layer: service
domain: system
file: "server/utils/planAuditoriaEmails.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/planAuditoriaEmails.ts

> **Ubicación:** `server/utils/planAuditoriaEmails.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Qué hacer con un email guardado tras comprobarlo en la web de su sala (auditoría de emails de leads y catálogo).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_emailConEvidencia|server/utils/emailConEvidencia.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_procedenciaDatos|server/utils/procedenciaDatos.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/planAuditoriaEmails.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
