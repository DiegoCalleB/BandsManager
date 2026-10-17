---
id: src_utils_limpiarChatLocal
title: "src/utils/limpiarChatLocal.ts"
layer: service
domain: system
file: "src/utils/limpiarChatLocal.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/limpiarChatLocal.ts

> **Ubicación:** `src/utils/limpiarChatLocal.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Prefijo con el que `Chatbot` guarda la conversación en `localStorage` (una clave por usuario y banda).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_hooks_useAuth|src/hooks/useAuth.ts]] *(from #security)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/limpiarChatLocal.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
