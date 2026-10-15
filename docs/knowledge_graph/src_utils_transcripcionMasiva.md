---
id: src_utils_transcripcionMasiva
title: "src/utils/transcripcionMasiva.ts"
layer: service
domain: system
file: "src/utils/transcripcionMasiva.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/transcripcionMasiva.ts

> **Ubicación:** `src/utils/transcripcionMasiva.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: ResumenTranscripcion, resumirTranscripcion.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_colaLetras|server/services/colaLetras.ts]] *(from #service)*
- [[src_components_repertorio_DiscografiaView|src/components/repertorio/DiscografiaView.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/audit/transcripcionMasiva.test.tsx`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
