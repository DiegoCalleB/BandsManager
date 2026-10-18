---
id: server_services_juezCartel
title: "server/services/juezCartel.ts"
layer: service
domain: system
file: "server/services/juezCartel.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/juezCartel.ts

> **Ubicación:** `server/services/juezCartel.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Juez de carteles: mira las variantes del fondo y elige la que mejor encaja en un cartel impreso.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_ai_ledger|AI Token Ledger]] *(Layer: #db, Domain: #system)*
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_imagenCartel|server/services/imagenCartel.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/juezCartel.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
