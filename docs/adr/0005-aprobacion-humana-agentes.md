# ADR 0005: Aprobación humana antes de cualquier envío de agente

- **Estado:** Aceptada
- **Fecha:** 2026-10-06 (primer commit del fichero; el historial de git empieza ese día, la decisión puede ser anterior)
- **Origen:** retroactiva. Fuentes: AGENTS.md §3 («Reglas de Negocio de Agentes IA»), `server/services/agentEngine.ts`, `server/services/lectorAgent.ts`.

## Contexto

Los agentes escriben a salas y promotores en nombre de una banda. Un correo mal dirigido o con una promesa que la banda no puede cumplir daña la reputación y puede tener consecuencias contractuales. Además, el envío de correo de terceros tiene riesgos legales (AGENTS.md §8).

## Decisión

Dos puertas en serie, ambas en `server/services/agentEngine.ts`:

1. **Aprobación humana.** El Enviador solo despacha leads cuyo `estado` es `aprobado`, `aprobado_propuesta` o `aprobado_respuesta` (`ESTADOS_DE_ENVIO`; la consulta de la línea ~117 los filtra siempre y además acota por banda, incluso cuando se pide un lead concreto). Ese estado lo fija una persona con `PUT /api/leads/{id}` (`server/routes/leads/crud.ts:170`). Los agentes buscan, redactan y clasifican, pero no se aprueban a sí mismos.
2. **Borrador por defecto, envío real opt-in.** Aun aprobado, el lead termina como **borrador en Gmail** salvo que se cumplan las TRES condiciones a la vez (línea 173): la plataforma tiene `AGENT_EMAIL_MODE=send`, la banda ha configurado `dispatch_mode = direct_send` y su `dispatch_level` no es `draft_only`. Sin configuración guardada, el valor por defecto es el seguro (`draft_gmail` / `draft_only`).

El PR template exige una casilla para que ningún cambio rompa estas puertas.

## Alternativas descartadas

- **Envío automático con umbral de confianza:** el modelo no tiene forma fiable de saber cuándo está equivocado en un correo comercial.
- **Aprobación en lote sin revisar cada borrador:** convierte la aprobación en un sello de goma.

## Consecuencias

- Menos automatización real, a cambio de control. Es un coste de producto asumido.
- **Matiz que el tribunal puede preguntar:** el envío directo sin ver el borrador existe, pero es una decisión explícita de la banda y de la plataforma, y siempre posterior a la aprobación del lead. La aprobación es un cambio de estado en un endpoint genérico (`PUT /api/leads/{id}`), no un endpoint propio; no se ha verificado aquí que el servidor impida que una llamada de API automatizada con credenciales de usuario fije ese estado.
- Un fallo aquí es un fallo de confianza, no de disponibilidad. Por eso la regla está en AGENTS.md y en el PR template, no solo en el código.
- Pendiente según AGENTS.md §8: mecanismo de baja en los correos comerciales.
