---
id: src_utils_modosAtril
title: "src/utils/modosAtril.ts"
layer: service
domain: repertoire
file: "src/utils/modosAtril.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 src/utils/modosAtril.ts

> **Ubicación:** `src/utils/modosAtril.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: ModoAtril, AjustesModoAtril, ajustesDeModoAtril.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_mezclaStems|src/utils/mezclaStems.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_Atril|src/components/Atril.tsx]] *(from #frontend)*
- [[src_components_atril_hooks_useAtrilAudio|src/components/atril/hooks/useAtrilAudio.ts]] *(from #frontend)*
- [[src_components_atril_hooks_useAtrilState|src/components/atril/hooks/useAtrilState.ts]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/modosAtril.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
