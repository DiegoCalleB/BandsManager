---
id: src_utils_referido
title: "src/utils/referido.ts"
layer: service
domain: system
file: "src/utils/referido.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/referido.ts

> **Ubicación:** `src/utils/referido.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Código de invitación de otra banda: se captura del `?ref=` de la URL al llegar, se guarda 30 días

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_hooks_useAuth|src/hooks/useAuth.ts]] *(from #security)*
- [[src_main|src/main.tsx]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/referido.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
