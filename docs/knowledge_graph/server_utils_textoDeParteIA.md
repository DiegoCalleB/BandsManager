---
id: server_utils_textoDeParteIA
title: "server/utils/textoDeParteIA.ts"
layer: service
domain: system
file: "server/utils/textoDeParteIA.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/textoDeParteIA.ts

> **Ubicación:** `server/utils/textoDeParteIA.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Texto de una parte de contenido del SDK de Gemini, para los proveedores que solo leen texto (failover a DeepSeek).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_ai|server/ai.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/textoDeParteIA.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
