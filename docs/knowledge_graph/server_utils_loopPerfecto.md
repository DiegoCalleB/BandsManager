---
id: server_utils_loopPerfecto
title: "server/utils/loopPerfecto.ts"
layer: service
domain: system
file: "server/utils/loopPerfecto.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/loopPerfecto.ts

> **Ubicación:** `server/utils/loopPerfecto.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Dónde cerrar el bucle de un Reel.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_audioEnergy|server/utils/audioEnergy.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_clipFiltros|server/utils/clipFiltros.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/loopPerfecto.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
