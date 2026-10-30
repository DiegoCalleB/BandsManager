---
id: src_utils_asesor_chat
title: "src/utils/asesor/chat.ts"
layer: service
domain: system
file: "src/utils/asesor/chat.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/asesor/chat.ts

> **Ubicación:** `src/utils/asesor/chat.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
El chat del asesor: preguntas libres de la banda sobre su marketing («¿por qué no crece el

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_asesor_diagnosticoMetricas|src/utils/asesor/diagnosticoMetricas.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_asesorMarketing|server/services/asesorMarketing.ts]] *(from #service)*
- [[src_components_asesor_ChatAsesor|src/components/asesor/ChatAsesor.tsx]] *(from #frontend)*
- [[src_components_asesor_hooks_useChatAsesor|src/components/asesor/hooks/useChatAsesor.ts]] *(from #frontend)*
- [[src_utils_asesorApi|src/utils/asesorApi.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/asesor/__tests__/chat.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
