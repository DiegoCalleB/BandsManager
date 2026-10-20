---
id: server_utils_permisosConcierto
title: "server/utils/permisosConcierto.ts"
layer: service
domain: system
file: "server/utils/permisosConcierto.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/permisosConcierto.ts

> **Ubicación:** `server/utils/permisosConcierto.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Conciertos y giras son cosa de la dirección (líder o admin): el caché, el contrato y los gastos

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_db_concerts|server/db/concerts.ts]] *(Layer: #db, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- `server/routes/concerts.ts` *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/conciertosGirasDireccion.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
