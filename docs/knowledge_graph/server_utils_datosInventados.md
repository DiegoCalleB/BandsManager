---
id: server_utils_datosInventados
title: "server/utils/datosInventados.ts"
layer: service
domain: system
file: "server/utils/datosInventados.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/datosInventados.ts

> **Ubicación:** `server/utils/datosInventados.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Detecta datos concretos de un pitch que no constan en los hechos reales de la banda o de la sala.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_evals_redactorGolden|server/evals/redactorGolden.ts]] *(from #service)*
- [[server_services_pitchJudge|server/services/pitchJudge.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
