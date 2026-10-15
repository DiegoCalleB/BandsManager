---
id: src_components_ensayos_formatTime
title: "src/components/ensayos/formatTime.ts"
layer: frontend
domain: system
file: "src/components/ensayos/formatTime.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/ensayos/formatTime.ts

> **Ubicación:** `src/components/ensayos/formatTime.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Formatea segundos como `MM:SS` o `HH:MM:SS` (cronómetro de ensayo).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_ensayos_BarraSeguimientoEnsayo|src/components/ensayos/BarraSeguimientoEnsayo.tsx]] *(from #frontend)*
- [[src_components_ensayos_EnsayoCronometro|src/components/ensayos/EnsayoCronometro.tsx]] *(from #frontend)*
- [[src_components_ensayos_GrabacionActaTab|src/components/ensayos/GrabacionActaTab.tsx]] *(from #frontend)*
- [[src_components_ensayos_ModoLocalEnVivoTab|src/components/ensayos/ModoLocalEnVivoTab.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/ensayos/__tests__/ensayosCalculations.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
