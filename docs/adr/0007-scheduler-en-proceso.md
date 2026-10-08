# ADR 0007: Scheduler de agentes en el mismo proceso

- **Estado:** Aceptada
- **Fecha:** 2026-10-06 (primer commit del fichero; el historial de git empieza ese día, la decisión puede ser anterior)
- **Origen:** retroactiva. Fuentes: `server/services/agentScheduler.ts:15` (`TICK_MS`, por defecto 24 h, configurable con `AGENT_SCHEDULER_INTERVAL_MS`), `server/services/agentQueueWorker.ts:23` (`POLL_INTERVAL_MS`, por defecto 24 h).

## Contexto

Los agentes necesitan ejecutarse periódicamente (buscar salas, leer respuestas). El despliegue es una sola instancia en Railway y el equipo no quiere operar un sistema de colas externo.

## Decisión

El scheduler y el worker de cola son temporizadores (`setInterval`/`setTimeout`) dentro del proceso del servidor. El ciclo por defecto es de 24 h; el worker es reactivo a eventos de cola y el temporizador solo sirve de red de seguridad. El intervalo es configurable por variable de entorno.

## Alternativas descartadas

- **Cola externa (BullMQ con Redis, o pg-boss):** garantías de entrega y escalado horizontal, pero añade un servicio que operar y pagar.
- **Cron de Railway o de Supabase que llama a un endpoint:** evita el proceso largo, pero reparte la lógica entre dos sitios y complica la trazabilidad.

## Consecuencias

- **Una sola instancia.** Si se escala a dos, cada proceso dispara sus propios ticks: hay que bloquear con la tabla `agent_schedule_state` (1.349 filas) o migrar a una cola. Esta es la condición para escalar.
- Un reinicio pierde el temporizador en curso; el estado en BD permite retomar.
- Corrección: el grafo de Obsidian decía «60 s». Era incorrecto; el valor real es el del código (24 h por defecto). El generador se ha corregido.
