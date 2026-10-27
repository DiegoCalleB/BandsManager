---
id: server_utils_beatThis_beatThis
title: "server/utils/beatThis/beatThis.ts"
layer: service
domain: system
file: "server/utils/beatThis/beatThis.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/beatThis/beatThis.ts

> **Ubicación:** `server/utils/beatThis/beatThis.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Pulsos y compases del audio con Beat This! (Foscarin, Schlüter y Widmer, ISMIR 2024; código y pesos

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_audioKey|server/utils/audioKey.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_beatThis_constantes|server/utils/beatThis/constantes.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_acordesCancion|server/services/acordesCancion.ts]] *(from #service)*
- [[server_utils_beatThis_compases|server/utils/beatThis/compases.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/beatThis/__tests__/compases.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
