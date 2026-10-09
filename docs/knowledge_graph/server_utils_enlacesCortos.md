---
id: server_utils_enlacesCortos
title: "server/utils/enlacesCortos.ts"
layer: service
domain: system
file: "server/utils/enlacesCortos.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/enlacesCortos.ts

> **Ubicación:** `server/utils/enlacesCortos.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Lógica pura de los enlaces cortos con atribución (bandmanager.io/r/<código>).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db_concerts|server/db/concerts.ts]] *(from #db)*
- [[server_db_enlacesCortos|server/db/enlacesCortos.ts]] *(from #db)*
- [[server_routes_campanaConcierto|server/routes/campanaConcierto.ts]] *(from #route)*
- [[server_routes_enlacesCortos|server/routes/enlacesCortos.ts]] *(from #route)*
- [[server_routes_paginaConcierto|server/routes/paginaConcierto.ts]] *(from #route)*
- [[server_services_perfilPublicoBanda|server/services/perfilPublicoBanda.ts]] *(from #service)*
- [[server_utils_paginaConcierto|server/utils/paginaConcierto.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
