---
id: server_services_consultaCatalogo
title: "server/services/consultaCatalogo.ts"
layer: service
domain: system
file: "server/services/consultaCatalogo.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/consultaCatalogo.ts

> **Ubicación:** `server/services/consultaCatalogo.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Consulta y alta desde el catálogo compartido de salas (fase 2).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_services_catalogoSalas|server/services/catalogoSalas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_consultaCatalogo|server/utils/consultaCatalogo.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db_consultaCatalogoSupabase|server/db/consultaCatalogoSupabase.ts]] *(from #db)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/consultaCatalogo.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
