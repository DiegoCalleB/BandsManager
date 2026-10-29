---
id: server_services_asesorInstagram
title: "server/services/asesorInstagram.ts"
layer: service
domain: social
file: "server/services/asesorInstagram.ts"
tags: ["service", "social", "auto"]
---

# 📌 server/services/asesorInstagram.ts

> **Ubicación:** `server/services/asesorInstagram.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/social`

## 📖 Descripción
Asesor de Marketing: trae de Instagram los números de una pieza publicada a mano. Con el token

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_asesorMarketing|server/db/asesorMarketing.ts]] *(Layer: #db, Domain: #system)*
- [[server_services_credencialesInstagram|server/services/credencialesInstagram.ts]] *(Layer: #service, Domain: #social)*
- [[server_services_publicadores_instagramReels|server/services/publicadores/instagramReels.ts]] *(Layer: #service, Domain: #social)*
- [[server_utils_paginaConcierto|server/utils/paginaConcierto.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_instagramMedios|src/utils/asesor/instagramMedios.ts]] *(Layer: #service, Domain: #social)*
- [[src_utils_asesor_opciones|src/utils/asesor/opciones.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_resumen|src/utils/asesor/resumen.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_campanaConcierto|src/utils/campanaConcierto.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_asesor|server/routes/asesor.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/asesorInstagram.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
