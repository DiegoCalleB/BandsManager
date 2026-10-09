---
id: src_utils_separacionIris
title: "src/utils/separacionIris.ts"
layer: service
domain: repertoire
file: "src/utils/separacionIris.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 src/utils/separacionIris.ts

> **Ubicación:** `src/utils/separacionIris.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: MotorIris, EtapaIris, ProveedorErrorIris, ProgresoIris, nombreMotor, textoInicio, textoVerificando, textoProcesando.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_fal|fal.ai]] *(Layer: #external, Domain: #system)*
- [[ext_ffmpeg|FFmpeg]] *(Layer: #external, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_iris_estudio|Estudio de canción e Iris (stems)]] *(from #feature)*
- [[src_components_Atril|src/components/Atril.tsx]] *(from #frontend)*
- [[src_components_chords_IrisStudio|src/components/chords/IrisStudio.tsx]] *(from #frontend)*
- [[src_hooks_useSeparacionIris|src/hooks/useSeparacionIris.ts]] *(from #hook)*

---

## 🧪 Tests que lo cubren
- `src/audit/irisStudioAtril.test.tsx`
- `src/utils/__tests__/separacionIris.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
