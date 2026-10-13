---
id: server_utils_hostUrl
title: "server/utils/hostUrl.ts"
layer: service
domain: system
file: "server/utils/hostUrl.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/hostUrl.ts

> **Ubicación:** `server/utils/hostUrl.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
true si el hostname de `url` es uno de `dominios` o un subdominio suyo. Compara el hostname ya

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_bands|server/routes/bands.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/hostUrl.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
