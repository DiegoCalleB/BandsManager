---
id: src_utils_cartel_textosLibres
title: "src/utils/cartel/textosLibres.ts"
layer: service
domain: system
file: "src/utils/cartel/textosLibres.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/cartel/textosLibres.ts

> **Ubicación:** `src/utils/cartel/textosLibres.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Textos sueltos de la persona («Entrada 8 €», «Con Los Toros»): hasta tres líneas que se colocan en el centro del

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_cartel_ajustesFinos|src/utils/cartel/ajustesFinos.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_layoutBase|src/utils/cartel/layoutBase.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_cartel_AjusteTexto|src/components/cartel/AjusteTexto.tsx]] *(from #frontend)*
- [[src_components_cartel_hooks_useAjusteFino|src/components/cartel/hooks/useAjusteFino.ts]] *(from #frontend)*
- [[src_components_cartel_hooks_useOrdenCartel|src/components/cartel/hooks/useOrdenCartel.ts]] *(from #frontend)*
- [[src_utils_cartel_config|src/utils/cartel/config.ts]] *(from #service)*
- [[src_utils_cartel_layout|src/utils/cartel/layout.ts]] *(from #service)*
- [[src_utils_cartel_ordenes|src/utils/cartel/ordenes.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/cartel/__tests__/textosLibres.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
