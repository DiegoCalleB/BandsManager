---
id: src_utils_ajusteCompases
title: "src/utils/ajusteCompases.ts"
layer: service
domain: system
file: "src/utils/ajusteCompases.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/ajusteCompases.ts

> **Ubicación:** `src/utils/ajusteCompases.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: sumarToque, bpmDeToques, desplazar, escalarTempo, mensajeCompases, validarAjusteCompases.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_cuadriculaCompases|src/utils/cuadriculaCompases.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_songs_ajusteCompases|server/routes/songs/ajusteCompases.ts]] *(from #route)*
- [[src_components_atril_AjusteCompases|src/components/atril/AjusteCompases.tsx]] *(from #frontend)*
- [[src_components_atril_AtrilCompases|src/components/atril/AtrilCompases.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/ajusteCompases.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
