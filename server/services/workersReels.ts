/**
 * Ciclo de vida del Reel publicado, en segundo plano: publicar a su hora (socialPublisher) y medir
 * lo publicado (metricasReels). Un único punto de arranque para server.ts.
 */
import { startSocialPublisherScheduler } from "./socialPublisher.js";
import { startMetricasReelsScheduler } from "./metricasReels.js";

export function iniciarWorkersDeReels(): void {
  startSocialPublisherScheduler();
  startMetricasReelsScheduler();
}
