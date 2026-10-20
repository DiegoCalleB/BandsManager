---
id: server_utils_ajusteDeCortes
title: "server/utils/ajusteDeCortes.ts"
layer: service
domain: system
file: "server/utils/ajusteDeCortes.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/ajusteDeCortes.ts

> **Ubicación:** `server/utils/ajusteDeCortes.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Ajusta cada corte elegido a un sitio donde se pueda cortar sin que suene a tijeretazo.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_audioEnergy|server/utils/audioEnergy.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_reelsCore|server/utils/reelsCore.ts]] *(Layer: #service, Domain: #social)*
- [[server_utils_viralSignals|server/utils/viralSignals.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_senalesVideo|server/services/senalesVideo.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/ajusteDeCortes.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
