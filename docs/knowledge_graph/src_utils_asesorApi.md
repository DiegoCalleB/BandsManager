---
id: src_utils_asesorApi
title: "src/utils/asesorApi.ts"
layer: service
domain: system
file: "src/utils/asesorApi.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/asesorApi.ts

> **Ubicación:** `src/utils/asesorApi.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Cliente de las rutas del Asesor de Marketing. Todas pasan por `apiFetch` (JWT + banda activa),

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_diagnostico|src/utils/asesor/diagnostico.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_estrategia|src/utils/asesor/estrategia.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_asesor_hooks_useAsesor|src/components/asesor/hooks/useAsesor.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
