---
id: server_db_asesorMarketing
title: "server/db/asesorMarketing.ts"
layer: db
domain: system
file: "server/db/asesorMarketing.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/asesorMarketing.ts

> **Ubicación:** `server/db/asesorMarketing.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Datos del Asesor de Marketing: la estrategia de la banda (`band_estrategia_marketing`), la fecha

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_tolerantWrite|server/db/tolerantWrite.ts]] *(Layer: #db, Domain: #system)*
- [[src_utils_asesor_estrategia|src/utils/asesor/estrategia.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_reglasFormato|src/utils/asesor/reglasFormato.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_resumen|src/utils/asesor/resumen.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_tipos|src/utils/asesor/tipos.ts]] *(Layer: #service, Domain: #system)*
- [[tabla_band_estrategia_marketing|tabla band_estrategia_marketing]] *(Layer: #schema, Domain: #system)*
- [[tabla_social_posts|tabla social_posts]] *(Layer: #schema, Domain: #social)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[server_routes_asesor|server/routes/asesor.ts]] *(from #route)*
- [[server_services_asesorInstagram|server/services/asesorInstagram.ts]] *(from #service)*
- [[server_services_asesorMarketing|server/services/asesorMarketing.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/asesorInstagram.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
