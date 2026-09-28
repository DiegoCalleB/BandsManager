---
id: route_repertoire
title: "Repertoire & Setlists Route"
layer: route
domain: repertoire
file: "server/routes/repertorio.ts"
tags: ["api", "route", "repertoire"]
---

# 📌 Repertoire & Setlists Route

> **Ubicación:** `server/routes/repertorio.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Endpoints para canciones, compatibilidad armónica y exportación a setlist.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[db_repertoire|Repertoire DB Handlers]] *(Layer: #db, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
