# ADR 0005: Aprobación humana antes de cualquier envío de agente

- **Estado:** Aceptada
- **Fecha:** anterior a 2026-10-08 (no consta en el repo)
- **Origen:** retroactiva. Fuentes: AGENTS.md §3 («Reglas de Negocio de Agentes IA»), `server/services/agentEngine.ts`, `server/services/lectorAgent.ts`.

## Contexto

Los agentes escriben a salas y promotores en nombre de una banda. Un correo mal dirigido o con una promesa que la banda no puede cumplir daña la reputación y puede tener consecuencias contractuales. Además, el envío de correo de terceros tiene riesgos legales (AGENTS.md §8).

## Decisión

Los agentes (Scout, Redactor, Enviador, Lector) pueden buscar, redactar y clasificar, pero el envío real requiere aprobación humana explícita. No hay modo «hands-off» ni excepción por configuración: el PR template lo exige como casilla.

## Alternativas descartadas

- **Envío automático con umbral de confianza:** el modelo no tiene forma fiable de saber cuándo está equivocado en un correo comercial.
- **Aprobación en lote sin revisar cada borrador:** convierte la aprobación en un sello de goma.

## Consecuencias

- Menos automatización real, a cambio de control. Es un coste de producto asumido.
- Un fallo aquí es un fallo de confianza, no de disponibilidad. Por eso la regla está en AGENTS.md y en el PR template, no solo en el código.
- Pendiente según AGENTS.md §8: mecanismo de baja en los correos comerciales.
