---
id: src_utils_cartel_render
title: "src/utils/cartel/render.ts"
layer: service
domain: system
file: "src/utils/cartel/render.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/cartel/render.ts

> **Ubicación:** `src/utils/cartel/render.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Pinta el cartel en un canvas a partir del layout puro. Es la única pieza con DOM del motor.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_cartel_config|src/utils/cartel/config.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_contraste|src/utils/cartel/contraste.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_formatos|src/utils/cartel/formatos.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_grano|src/utils/cartel/grano.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_layout|src/utils/cartel/layout.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_cartel_hooks_useAdnCartel|src/components/cartel/hooks/useAdnCartel.ts]] *(from #frontend)*
- [[src_components_cartel_hooks_useEditorCartel|src/components/cartel/hooks/useEditorCartel.ts]] *(from #frontend)*
- [[src_components_cartel_SelectorFondo|src/components/cartel/SelectorFondo.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/cartel/__tests__/texto.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
