---
id: server_utils_salaCatalogo
title: "server/utils/salaCatalogo.ts"
layer: service
domain: system
file: "server/utils/salaCatalogo.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/salaCatalogo.ts

> **Ubicación:** `server/utils/salaCatalogo.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Catálogo compartido de salas: reglas puras (sin red ni base de datos).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_emailValidator|server/utils/emailValidator.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db_salasCatalogo|server/db/salasCatalogo.ts]] *(from #db)*
- [[server_evals_catalogoGolden|server/evals/catalogoGolden.ts]] *(from #service)*
- [[server_services_catalogoSalas|server/services/catalogoSalas.ts]] *(from #service)*
- [[server_services_consultaCatalogo|server/services/consultaCatalogo.ts]] *(from #service)*
- [[server_services_importarSalasOsm|server/services/importarSalasOsm.ts]] *(from #service)*
- [[server_utils_consultaCatalogo|server/utils/consultaCatalogo.ts]] *(from #service)*
- [[server_utils_estadoNegocio|server/utils/estadoNegocio.ts]] *(from #service)*
- [[server_utils_instagramEnWeb|server/utils/instagramEnWeb.ts]] *(from #service)*
- [[server_utils_osmSalas|server/utils/osmSalas.ts]] *(from #service)*
- [[server_utils_seo_salas_tipos|server/utils/seo/salas/tipos.ts]] *(from #service)*
- [[server_utils_sugerenciasCatalogo|server/utils/sugerenciasCatalogo.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/catalogoSalas.test.ts`
- `server/utils/__tests__/salaCatalogo.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
