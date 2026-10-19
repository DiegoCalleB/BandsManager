---
id: server_db_salasPublicas
title: "server/db/salasPublicas.ts"
layer: db
domain: system
file: "server/db/salasPublicas.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/salasPublicas.ts

> **Ubicación:** `server/db/salasPublicas.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Directorio público de salas: lee del catálogo solo las columnas públicas (nunca `email_contacto` ni `telefono`).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_utils_seo_salas_publicas|server/utils/seo/salas/publicas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_seo_salas_tipos|server/utils/seo/salas/tipos.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[server_services_salasPublicas|server/services/salasPublicas.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
