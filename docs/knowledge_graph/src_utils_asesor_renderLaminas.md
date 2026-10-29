---
id: src_utils_asesor_renderLaminas
title: "src/utils/asesor/renderLaminas.ts"
layer: service
domain: system
file: "src/utils/asesor/renderLaminas.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/asesor/renderLaminas.ts

> **Ubicación:** `src/utils/asesor/renderLaminas.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Pinta las láminas de una pieza en canvas. Es la única pieza con DOM de las láminas; qué texto va

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_asesor_laminas|src/utils/asesor/laminas.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_arteCanvas|src/utils/cartel/arteCanvas.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_contraste|src/utils/cartel/contraste.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_grano|src/utils/cartel/grano.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_render|src/utils/cartel/render.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_texto|src/utils/cartel/texto.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_velo|src/utils/cartel/velo.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_voces|src/utils/cartel/voces.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_asesor_hooks_useLaminas|src/components/asesor/hooks/useLaminas.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
