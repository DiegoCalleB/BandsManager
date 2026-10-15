---
id: src_utils_cartel_adn
title: "src/utils/cartel/adn.ts"
layer: service
domain: system
file: "src/utils/cartel/adn.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/cartel/adn.ts

> **Ubicación:** `src/utils/cartel/adn.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
El «ADN visual» de la banda: lo que hace que sus carteles se parezcan a ellos. Una fila por banda

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_cartel_estilos|src/utils/cartel/estilos.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db_cartelEstilo|server/db/cartelEstilo.ts]] *(from #db)*
- [[server_routes_cartelria|server/routes/cartelria.ts]] *(from #route)*
- [[server_services_referenciasCartel|server/services/referenciasCartel.ts]] *(from #service)*
- [[src_components_cartel_EstiloBanda|src/components/cartel/EstiloBanda.tsx]] *(from #frontend)*
- [[src_components_cartel_hooks_useAdnCartel|src/components/cartel/hooks/useAdnCartel.ts]] *(from #frontend)*
- [[src_components_cartel_hooks_useEditorCartel|src/components/cartel/hooks/useEditorCartel.ts]] *(from #frontend)*
- [[src_utils_promocionApi|src/utils/promocionApi.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/cartel/__tests__/adn.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
