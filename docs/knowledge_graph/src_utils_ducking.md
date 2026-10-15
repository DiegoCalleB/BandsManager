---
id: src_utils_ducking
title: "src/utils/ducking.ts"
layer: service
domain: system
file: "src/utils/ducking.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/ducking.ts

> **Ubicación:** `src/utils/ducking.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Ducking del Atril: la canción baja un instante mientras suena un acorde de muestra y vuelve sola.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_hooks_useMezclaStems|src/hooks/useMezclaStems.ts]] *(from #hook)*
- [[src_utils_sonarAcorde|src/utils/sonarAcorde.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/audit/sonarAcorde.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
