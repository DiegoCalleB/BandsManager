---
id: server_utils_webOficial
title: "server/utils/webOficial.ts"
layer: service
domain: system
file: "server/utils/webOficial.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/webOficial.ts

> **Ubicación:** `server/utils/webOficial.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Elige la web oficial de una sala o festival entre los resultados de un buscador, sin adivinar: solo vale un dominio que lleve

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_emailsDeContacto|server/utils/emailsDeContacto.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_salaCatalogo|server/utils/salaCatalogo.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_buscarWebsDeSalas|server/services/buscarWebsDeSalas.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/webOficial.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
