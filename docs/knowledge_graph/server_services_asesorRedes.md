---
id: server_services_asesorRedes
title: "server/services/asesorRedes.ts"
layer: service
domain: system
file: "server/services/asesorRedes.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/asesorRedes.ts

> **Ubicación:** `server/services/asesorRedes.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Asesor de Marketing: los números de una pieza en TikTok y YouTube Shorts. Instagram tiene su camino

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_asesorMarketing|server/db/asesorMarketing.ts]] *(Layer: #db, Domain: #system)*
- [[server_utils_paginaConcierto|server/utils/paginaConcierto.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_estrategia|src/utils/asesor/estrategia.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_metricasPorRed|src/utils/asesor/metricasPorRed.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_opciones|src/utils/asesor/opciones.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_resumen|src/utils/asesor/resumen.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_campanaConcierto|src/utils/campanaConcierto.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_asesor|server/routes/asesor.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
