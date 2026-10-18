# ADR 0007: Scheduler de agentes en el mismo proceso

- **Estado:** Aceptada
- **Fecha:** 2026-10-06 (primer commit del fichero; el historial de git empieza ese día, la decisión puede ser anterior)
- **Origen:** retroactiva. Fuentes: `server/services/agentScheduler.ts` (`TICK_MS`, configurable con `AGENT_SCHEDULER_INTERVAL_MS`), `server/services/agentQueueWorker.ts` (`POLL_INTERVAL_MS`, configurable con `AGENT_WORKER_POLL_MS`).

## Contexto

Los agentes necesitan ejecutarse periódicamente (buscar salas, leer respuestas). El despliegue es una sola instancia en Railway y el equipo no quiere operar un sistema de colas externo.

## Decisión

El scheduler y el worker de cola son temporizadores (`setInterval`/`setTimeout`) dentro del proceso del servidor. El tick por defecto es de 5 min (más uno a los 30 s de arrancar) y solo mira la hora local de cada banda: el Enviador y el Lector se encolan una vez por cada hora de su ventana (`horas_*`/`dias_*` de `band_schedules`), con la marca en `agent_schedule_state`. El worker es reactivo a eventos de cola y además sondea cada 60 s para los reintentos con backoff. Ambos intervalos son configurables por variable de entorno.

## Alternativas descartadas

- **Cola externa (BullMQ con Redis, o pg-boss):** garantías de entrega y escalado horizontal, pero añade un servicio que operar y pagar.
- **Cron de Railway o de Supabase que llama a un endpoint:** evita el proceso largo, pero reparte la lógica entre dos sitios y complica la trazabilidad.

## Consecuencias

- **Una sola instancia.** Si se escala a dos, cada proceso dispara sus propios ticks: hay que bloquear con la tabla `agent_schedule_state` (1.349 filas) o migrar a una cola. Esta es la condición para escalar.
- Un reinicio pierde el temporizador en curso; el estado en BD permite retomar.
- Corrección: el grafo de Obsidian decía «60 s». Era incorrecto; el valor real es el del código (24 h por defecto). El generador se ha corregido.
- **Corrección (2026-10-14):** el tick de 24 h era incompatible con las ventanas por hora: el Enviador solo se disparaba si la hora de arranque del proceso caía en la ventana de la banda, cada redeploy reiniciaba la cuenta, el Lector ignoraba `horas_lector` y los reintentos con backoff esperaban al sondeo de 24 h del worker. Pasa a 5 min (scheduler) y 60 s (worker); con 1 tick barato por banda (una consulta de horario), las consultas de email y last-run solo se hacen cuando a la banda le toca algo.
