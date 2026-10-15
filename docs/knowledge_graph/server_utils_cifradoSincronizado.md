---
id: server_utils_cifradoSincronizado
title: "server/utils/cifradoSincronizado.ts"
layer: service
domain: system
file: "server/utils/cifradoSincronizado.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/cifradoSincronizado.ts

> **Ubicación:** `server/utils/cifradoSincronizado.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: cambiosDeAcorde, acordeEnInstante, construirCifradoSincronizado.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_services_transcripcionLetra|server/services/transcripcionLetra.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_silabas|src/utils/silabas.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_letraCancion|server/services/letraCancion.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/cifradoSincronizado.test.ts`
- `server/utils/__tests__/resaltadoSinSaltos.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
