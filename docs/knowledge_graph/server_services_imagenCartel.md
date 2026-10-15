---
id: server_services_imagenCartel
title: "server/services/imagenCartel.ts"
layer: service
domain: system
file: "server/services/imagenCartel.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/imagenCartel.ts

> **Ubicación:** `server/services/imagenCartel.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Genera el fondo de un cartel con el modelo de imagen de Gemini y lo guarda en Supabase Storage.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_ai_ledger|AI Token Ledger]] *(Layer: #db, Domain: #system)*
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_referenciasCartel|server/services/referenciasCartel.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_cartelUrl|server/utils/cartelUrl.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_promptCartel|server/utils/promptCartel.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_storage|server/utils/storage.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_cartelria|server/routes/cartelria.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/referenciasCartel.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
