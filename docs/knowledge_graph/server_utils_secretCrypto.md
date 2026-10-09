---
id: server_utils_secretCrypto
title: "server/utils/secretCrypto.ts"
layer: service
domain: system
file: "server/utils/secretCrypto.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/secretCrypto.ts

> **Ubicación:** `server/utils/secretCrypto.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: isEncryptedSecret, encryptSecret, decryptSecret.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db_emailAccounts|server/db/emailAccounts.ts]] *(from #db)*
- [[server_db_gmailOAuth|server/db/gmailOAuth.ts]] *(from #security)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/secretCrypto.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
