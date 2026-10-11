---
id: server_services_transcripcionLetra
title: "server/services/transcripcionLetra.ts"
layer: service
domain: repertoire
file: "server/services/transcripcionLetra.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 server/services/transcripcionLetra.ts

> **Ubicación:** `server/services/transcripcionLetra.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: PalabraLetra, LineaLetra, Transcripcion, agruparPalabras, normalizarSalidaWhisper, repararTiempos, limpiarLineas, confianzaGlobal.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_replicate|Replicate]] *(Layer: #external, Domain: #system)*
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_letraCancion|server/services/letraCancion.ts]] *(from #service)*
- [[server_utils_cifradoSincronizado|server/utils/cifradoSincronizado.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/transcripcionLetra.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
