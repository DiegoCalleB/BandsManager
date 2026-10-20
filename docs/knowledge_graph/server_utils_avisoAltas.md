---
id: server_utils_avisoAltas
title: "server/utils/avisoAltas.ts"
layer: service
domain: system
file: "server/utils/avisoAltas.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/avisoAltas.ts

> **Ubicación:** `server/utils/avisoAltas.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Aviso interno al responsable de BandManager cuando alguien se registra o entra en la lista de espera.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_html|server/utils/html.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_avisoAltas|server/services/avisoAltas.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/avisoAltas.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
