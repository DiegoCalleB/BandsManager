---
id: src_utils_cartel_ajustesFinos
title: "src/utils/cartel/ajustesFinos.ts"
layer: service
domain: system
file: "src/utils/cartel/ajustesFinos.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/cartel/ajustesFinos.ts

> **Ubicación:** `src/utils/cartel/ajustesFinos.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Ajuste fino a mano: mover y escalar cada bloque del texto (nombre, fecha, datos, QR, logos, pie) sobre el

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_cartel_formatos|src/utils/cartel/formatos.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_layoutBase|src/utils/cartel/layoutBase.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_voces|src/utils/cartel/voces.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_cartel_AjusteTexto|src/components/cartel/AjusteTexto.tsx]] *(from #frontend)*
- [[src_components_cartel_CarteleriaView|src/components/cartel/CarteleriaView.tsx]] *(from #frontend)*
- [[src_components_cartel_hooks_useAjusteFino|src/components/cartel/hooks/useAjusteFino.ts]] *(from #frontend)*
- [[src_components_cartel_hooks_useEditorCartel|src/components/cartel/hooks/useEditorCartel.ts]] *(from #frontend)*
- [[src_utils_cartel_config|src/utils/cartel/config.ts]] *(from #service)*
- [[src_utils_cartel_layout|src/utils/cartel/layout.ts]] *(from #service)*
- [[src_utils_cartel_layoutBase|src/utils/cartel/layoutBase.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/cartel/__tests__/ajustesFinos.test.ts`
- `src/utils/cartel/__tests__/estilosBloques.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
