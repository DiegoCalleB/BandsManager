---
id: src_utils_reintentar
title: "src/utils/reintentar.ts"
layer: service
domain: system
file: "src/utils/reintentar.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/reintentar.ts

> **Ubicación:** `src/utils/reintentar.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Repite una tarea que falla (red, 5xx) esperando `esperasMs[i]` entre intentos. Si `cancelado()` pasa a true

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_cartel_hooks_useEditorCartel|src/components/cartel/hooks/useEditorCartel.ts]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/reintentar.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
