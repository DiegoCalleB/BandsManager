---
id: src_utils_cartel_paleta
title: "src/utils/cartel/paleta.ts"
layer: service
domain: system
file: "src/utils/cartel/paleta.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/cartel/paleta.ts

> **Ubicación:** `src/utils/cartel/paleta.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
«Tus colores»: una paleta de cartel (fondo + acento) sacada de una imagen, normalmente el logo.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_cartel_contraste|src/utils/cartel/contraste.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_cartel_hooks_useAdnCartel|src/components/cartel/hooks/useAdnCartel.ts]] *(from #frontend)*
- [[src_components_cartel_SelectorFondo|src/components/cartel/SelectorFondo.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/cartel/__tests__/paleta.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
