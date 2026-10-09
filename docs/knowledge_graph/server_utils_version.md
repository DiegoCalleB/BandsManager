---
id: server_utils_version
title: "server/utils/version.ts"
layer: service
domain: system
file: "server/utils/version.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/version.ts

> **Ubicación:** `server/utils/version.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Versión de la aplicación (SemVer). Única fuente de verdad: `version` de package.json, que mantiene

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_utils_errorTracking|server/utils/errorTracking.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
