---
id: src_utils_cartel_idea
title: "src/utils/cartel/idea.ts"
layer: service
domain: system
file: "src/utils/cartel/idea.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/cartel/idea.ts

> **Ubicación:** `src/utils/cartel/idea.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
La «idea» que la persona tiene del cartel, en cinco campos cortos y todos opcionales. Cuanto más

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_cartelria|server/routes/cartelria.ts]] *(from #route)*
- [[server_services_briefCartel|server/services/briefCartel.ts]] *(from #service)*
- [[src_components_cartel_hooks_useIdeaCartel|src/components/cartel/hooks/useIdeaCartel.ts]] *(from #frontend)*
- [[src_components_cartel_IdeaCartel|src/components/cartel/IdeaCartel.tsx]] *(from #frontend)*
- [[src_utils_promocionApi|src/utils/promocionApi.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/briefCartel.test.ts`
- `src/utils/cartel/__tests__/idea.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
