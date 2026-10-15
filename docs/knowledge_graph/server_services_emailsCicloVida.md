---
id: server_services_emailsCicloVida
title: "server/services/emailsCicloVida.ts"
layer: service
domain: system
file: "server/services/emailsCicloVida.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/emailsCicloVida.ts

> **Ubicación:** `server/services/emailsCicloVida.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Envío de los emails de ciclo de vida (onboarding). Apagado por defecto: solo corre con

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_emailsCicloVida|server/db/emailsCicloVida.ts]] *(Layer: #db, Domain: #system)*
- [[server_services_transactionalEmail|server/services/transactionalEmail.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_emailsCicloVida|server/utils/emailsCicloVida.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_errorTracking|server/utils/errorTracking.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_paginaConcierto|server/routes/paginaConcierto.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/emailsCicloVida.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
