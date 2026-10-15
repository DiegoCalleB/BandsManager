---
id: server_utils_promptCartel
title: "server/utils/promptCartel.ts"
layer: service
domain: system
file: "server/utils/promptCartel.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/promptCartel.ts

> **Ubicación:** `server/utils/promptCartel.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Prompt del fondo de un cartel. Función pura: la IA pinta SOLO la ilustración; el texto

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[sec_prompt_safety|Prompt Injection Sanitizer]] *(Layer: #security, Domain: #system)*
- [[src_utils_cartel_estilos|src/utils/cartel/estilos.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_cartelria|server/routes/cartelria.ts]] *(from #route)*
- [[server_services_imagenCartel|server/services/imagenCartel.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/promptCartel.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
