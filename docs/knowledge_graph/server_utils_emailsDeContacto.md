---
id: server_utils_emailsDeContacto
title: "server/utils/emailsDeContacto.ts"
layer: service
domain: system
file: "server/utils/emailsDeContacto.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/emailsDeContacto.ts

> **Ubicación:** `server/utils/emailsDeContacto.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Qué buzón es cada email de la web de un festival y cuál sirve para proponer un concierto.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_scout|Scout Discovery Agent]] *(from #agent)*
- [[server_utils_emailsDeAyuntamiento|server/utils/emailsDeAyuntamiento.ts]] *(from #service)*
- [[server_utils_webOficial|server/utils/webOficial.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/emailsDeContacto.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
