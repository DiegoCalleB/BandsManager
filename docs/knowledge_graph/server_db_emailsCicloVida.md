---
id: server_db_emailsCicloVida
title: "server/db/emailsCicloVida.ts"
layer: db
domain: system
file: "server/db/emailsCicloVida.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/emailsCicloVida.ts

> **Ubicación:** `server/db/emailsCicloVida.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Acceso a datos de los emails de ciclo de vida (onboarding). Ver server/utils/emailsCicloVida.ts.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[tabla_concerts|tabla concerts]] *(Layer: #schema, Domain: #system)*
- [[tabla_emails_ciclo_vida|tabla emails_ciclo_vida]] *(Layer: #schema, Domain: #system)*
- [[tabla_epk_configs|tabla epk_configs]] *(Layer: #schema, Domain: #epk)*
- [[tabla_users|tabla users]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[server_routes_emailsCicloVida|server/routes/emailsCicloVida.ts]] *(from #route)*
- [[server_services_emailsCicloVida|server/services/emailsCicloVida.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
