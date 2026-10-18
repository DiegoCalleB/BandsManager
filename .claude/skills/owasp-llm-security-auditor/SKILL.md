---
name: owasp-llm-security-auditor
description: Blindaje de ciberseguridad avanzado y auditoría contra los riesgos del OWASP Top 10 for LLMs en BandManager.io. Protege contra inyecciones directas/indirectas, fuga de datos multi-tenant, SSRF y manipulación de outputs.
---

# 🛡️ Skill: OWASP LLM & Cyber-Hardening Security Auditor

Esta skill establece las directrices de **defensa en profundidad y blindaje total contra ciberataques** enfocados en arquitecturas agénticas, aplicaciones con modelos de lenguaje y sistemas multi-inquilino.

---

## 🛑 1. El OWASP Top 10 para LLMs en BandManager.io

| Vector de Riesgo | Amenaza en BandManager.io | Mecanismo de Defensa Obligatorio |
|---|---|---|
| **LLM01: Prompt Injection** | Emails de salas entrantes o webs scrapeadas contienen instrucciones para alterar el rol del agente. | Sanitización con `sanitizeExternalText` (`server/utils/promptSafety.ts`) + instrucción explícita de dato no ejecutable + **Aprobación humana obligatoria antes de enviar**. |
| **LLM02: Insecure Output Handling** | Respuestas de la IA que contengan payloads XSS o scripts maliciosos. | Sanitización de HTML en frontend (`src/utils/escapeHtml.ts`, `src/utils/richText.tsx`) y cabeceras `X-Content-Type-Options: nosniff`. |
| **LLM03: Training Data Poisoning** | Feedbacks manipulados en `pitchLearning.ts` para degradar la calidad de los pitches futuros. | Validación de origen y límites por banda en el almacenamiento de vectores y ejemplos. |
| **LLM04: Model Denial of Service** | Ataques de saturación de contexto con prompts gigantes para agotar cuotas o CPU. | Limitador `iaRateLimiter` + validación de longitud máxima en inputs de usuario. |
| **LLM06: Sensitive Information Disclosure** | Fuga de datos privados de una banda a otra a través de respuestas del agente. | Aislamiento estricto por `getTargetBandId(req)` en el contexto inyectado al prompt. |
| **LLM07: Insecure Plugin/Tool Design** | Acceso no autorizado a herramientas de base de datos o envíos de correo sin autorización. | Los agentes operan solo en base de datos; los envíos requieren cambio explícito de estado a `aprobado_*` por usuario. |
| **LLM08: Excessive Agency** | Agentes autónomos tomando decisiones financieras o cancelaciones sin supervisión. | El scheduler no puede alterar cachés, confirmar bolos o ejecutar cobros sin acción humana en la UI. |

---

## 🔒 2. Blindaje de Red y Acceso Externo (SSRF Guard)

Toda petición HTTP externa iniciada por el backend (para análisis de salas, feeds o APIs de terceros) debe pasar por `esUrlExternaSegura` (`server/utils/ssrfGuard.ts`):

```typescript
import { esUrlExternaSegura } from '../utils/ssrfGuard.js';

export async function validarUrlExterna(urlStr: string): Promise<boolean> {
  // 1. Bloqueo de esquemas no HTTP/HTTPS (file://, ftp://, gopher://)
  // 2. Bloqueo de rangos privados (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
  // 3. Bloqueo de loopback (127.0.0.1, localhost) y metadata de cloud (169.254.169.254)
  return await esUrlExternaSegura(urlStr);
}
```

---

## 🛡️ 3. Protección Criptográfica de Propiedad Intelectual Musical

- **Jerarquía de Storage Aislada:** `stems/{bandId}/{songHash}/...`
- **Firma de feeds y enlaces:** Tokens cifrados con HMAC para el acceso al EPK público (`https://bandmanager.io/epk?b={{token}}`).
- **Prevención de Path Traversal:** Validadores dedicados (`subcarpetaSegura`, `rutaFuenteSegura`).

---

## ✅ Checklist de Ciberseguridad Agéntica

- [ ] ¿Todos los textos no confiables de terceros pasan por `sanitizeExternalText` antes de formar prompts?
- [ ] ¿Se impide cualquier envío autónomo sin la bandera `aprobado_propuesta` o `aprobado_respuesta`?
- [ ] ¿Todas las llamadas HTTP salientes están protegidas por `esUrlExternaSegura`?
- [ ] ¿Los endpoints de IA tienen aplicado `iaRateLimiter` y `requireAuth`?
- [ ] ¿El acceso a la base de datos utiliza parametrización estricta sin concatenación de SQL?
- [ ] ¿Se ejecutan los tests de seguridad de aislamiento multi-tenant en CI?
