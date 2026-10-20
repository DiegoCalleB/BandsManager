---
id: src_utils_logoDeSala
title: "src/utils/logoDeSala.ts"
layer: service
domain: system
file: "src/utils/logoDeSala.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/logoDeSala.ts

> **Ubicación:** `src/utils/logoDeSala.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Logo de una sala a partir de su web: el icono del dominio, por referencia. No se descarga ni se guarda ningún fichero

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_utils_consultaCatalogo|server/utils/consultaCatalogo.ts]] *(from #service)*
- [[src_components_booking_catalogo_LogoSala|src/components/booking/catalogo/LogoSala.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/logoDeSala.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
