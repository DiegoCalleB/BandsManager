---
id: server_utils_referidos
title: "server/utils/referidos.ts"
layer: service
domain: system
file: "server/utils/referidos.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/referidos.ts

> **Ubicación:** `server/utils/referidos.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Insignia «Powered by BandManager.io» y referidos entre bandas. Lógica pura, sin I/O.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db_referidos|server/db/referidos.ts]] *(from #db)*
- [[server_routes_paginaConcierto|server/routes/paginaConcierto.ts]] *(from #route)*
- [[server_routes_referidos|server/routes/referidos.ts]] *(from #route)*
- [[server_services_perfilPublicoBanda|server/services/perfilPublicoBanda.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/referidos.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
