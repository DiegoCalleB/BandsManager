---
id: server_utils_enlacesBandas
title: "server/utils/enlacesBandas.ts"
layer: service
domain: system
file: "server/utils/enlacesBandas.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/enlacesBandas.ts

> **Ubicación:** `server/utils/enlacesBandas.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Enlaces de bandas amigas (tabla `enlaces_bandas_amigas`, una fila por banda y plataforma).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db_contacts|server/db/contacts.ts]] *(from #db)*
- [[server_db_enlacesBandas|server/db/enlacesBandas.ts]] *(from #db)*
- [[server_routes_bandMusic|server/routes/bandMusic.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
