---
id: src_utils_fiabilidadEmail
title: "src/utils/fiabilidadEmail.ts"
layer: service
domain: system
file: "src/utils/fiabilidadEmail.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/fiabilidadEmail.ts

> **Ubicación:** `src/utils/fiabilidadEmail.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Fiabilidad de un email de contacto (0-100), calculada SOLO con evidencia: de dónde salió, cuándo se volvió a ver y

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_utils_procedenciaDatos|server/utils/procedenciaDatos.ts]] *(from #service)*
- [[src_utils_estadoDeContacto|src/utils/estadoDeContacto.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/fiabilidadEmail.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
