---
id: src_utils_cartel_estilos
title: "src/utils/cartel/estilos.ts"
layer: service
domain: system
file: "src/utils/cartel/estilos.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/cartel/estilos.ts

> **Ubicación:** `src/utils/cartel/estilos.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Estilos de fondo de un cartel. Fuente única: la usan el servidor (prompt y validación) y el cliente.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_utils_promptCartel|server/utils/promptCartel.ts]] *(from #service)*
- [[src_components_cartel_EstiloBanda|src/components/cartel/EstiloBanda.tsx]] *(from #frontend)*
- [[src_components_cartel_SelectorFondo|src/components/cartel/SelectorFondo.tsx]] *(from #frontend)*
- [[src_utils_cartel_adn|src/utils/cartel/adn.ts]] *(from #service)*
- [[src_utils_promocionApi|src/utils/promocionApi.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
