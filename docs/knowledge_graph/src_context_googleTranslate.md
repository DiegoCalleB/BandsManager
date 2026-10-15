---
id: src_context_googleTranslate
title: "src/context/googleTranslate.ts"
layer: service
domain: repertoire
file: "src/context/googleTranslate.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 src/context/googleTranslate.ts

> **Ubicación:** `src/context/googleTranslate.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: quitarMarcaDeTraduccion, traducirConGoogle, montarWidgetDeGoogle.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_context_idioma|src/context/idioma.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_context_LanguageContext|src/context/LanguageContext.tsx]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/context/__tests__/googleTranslateTemporizadores.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
