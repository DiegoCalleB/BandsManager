---
id: src_utils_idiomaNavegador
title: "src/utils/idiomaNavegador.ts"
layer: service
domain: system
file: "src/utils/idiomaNavegador.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/idiomaNavegador.ts

> **Ubicación:** `src/utils/idiomaNavegador.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Qué idioma conviene mostrar según los idiomas preferidos del navegador (`navigator.languages`, por orden).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_utils_seo_avisoIdioma|server/utils/seo/avisoIdioma.ts]] *(from #service)*
- [[src_context_LanguageContext|src/context/LanguageContext.tsx]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/idiomaNavegador.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
