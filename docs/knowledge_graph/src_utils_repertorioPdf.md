---
id: src_utils_repertorioPdf
title: "src/utils/repertorioPdf.ts"
layer: service
domain: system
file: "src/utils/repertorioPdf.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/repertorioPdf.ts

> **Ubicación:** `src/utils/repertorioPdf.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Utilidades de generación de estilos y hojas de impresión para setlists en PDF

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_config_defaultRepertoire|src/config/defaultRepertoire.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_escapeHtml|src/utils/escapeHtml.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_repertorioUtils|src/utils/repertorioUtils.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_hooks_useSetlistItemActions|src/components/repertorio/hooks/useSetlistItemActions.ts]] *(from #frontend)*
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/repertorioPdf.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
