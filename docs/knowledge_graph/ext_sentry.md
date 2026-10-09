---
id: ext_sentry
title: "Sentry"
layer: external
domain: system
file: "servicio externo"
tags: ["external", "auto"]
---

# 📌 Sentry

> **Ubicación:** `servicio externo`  
> **Capa:** `#layer/external` | **Dominio:** `#domain/system`

## 📖 Descripción
Seguimiento de errores en cliente y servidor.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_utils_errorTracking|server/utils/errorTracking.ts]] *(from #service)*
- [[src_utils_errorTracking|src/utils/errorTracking.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
