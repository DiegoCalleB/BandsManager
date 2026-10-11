---
id: src_context_LanguageContext
title: "src/context/LanguageContext.tsx"
layer: service
domain: system
file: "src/context/LanguageContext.tsx"
tags: ["service", "system", "auto"]
---

# 📌 src/context/LanguageContext.tsx

> **Ubicación:** `src/context/LanguageContext.tsx`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: LanguageProvider.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_context_googleTranslate|src/context/googleTranslate.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_context_idioma|src/context/idioma.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_main|src/main.tsx]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/context/__tests__/LanguageContext.behavior.test.tsx`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
