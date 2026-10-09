---
id: server_utils_colaLetras
title: "server/utils/colaLetras.ts"
layer: service
domain: repertoire
file: "server/utils/colaLetras.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 server/utils/colaLetras.ts

> **Ubicación:** `server/utils/colaLetras.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Reglas puras de la cola de letras: topes por plan y qué pasa tras cada intento. Sin base de datos,

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_colaLetras|server/services/colaLetras.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/colaLetras.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
