---
id: server_utils_bancoDeteccion
title: "server/utils/bancoDeteccion.ts"
layer: service
domain: system
file: "server/utils/bancoDeteccion.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/bancoDeteccion.ts

> **Ubicación:** `server/utils/bancoDeteccion.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Banco de pruebas de la detección de momentos virales.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_audioEnergy|server/utils/audioEnergy.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_senalesPublico|server/utils/senalesPublico.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_viralSignals|server/utils/viralSignals.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🧪 Tests que lo cubren
- `server/utils/bancoDeteccion.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
