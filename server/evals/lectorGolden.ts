// Banco de evaluación del Lector: respuestas reales de salas (anonimizadas) con la clasificación que debería salir.
// Mide el clasificador que decide si un lead pasa a negociando / confirmado / no_interesado. Sin IA ni red: es
// determinista, gratis y rápido, así que corre en CI. Cada caso que falle hoy lleva `conocido` (con el motivo):
// el test impide que aparezcan fallos NUEVOS y avisa si uno conocido se arregla, para quitarle la marca.
//   npm run eval:agentes   # informe por clase
import { detectResponseType, type ResponseType } from "../services/replyDrafting.js";
import { quitarTextoCitado } from "../utils/respuestaEntrante.js";

export interface CasoLector {
  id: string;
  lang?: string;
  texto: string;
  esperado: ResponseType;
  /** Fallo conocido del clasificador actual: por qué falla y qué lo arreglaría. */
  conocido?: string;
}

const CITA = "\n\nEl jue, 5 nov 2026 a las 10:14, Booking <booking@banda.example> escribió:\n> Hola, somos una banda de rock y nos gustaría tocar en vuestra sala. ¿Tenéis fechas libres? Nuestro caché es de 800 euros.";

export const CASOS_LECTOR: CasoLector[] = [
  // Confirmación
  { id: "conf-01", texto: "Hola! Nos encanta la propuesta. Queremos cerrar la fecha, confirmamos el 14 de diciembre.", esperado: "confirmation" },
  { id: "conf-02", texto: "Perfecto, nos encaja. Os mando el contrato mañana.", esperado: "confirmation" },
  { id: "conf-03", texto: "Genial, queda confirmado entonces. Un saludo.", esperado: "confirmation" },
  { id: "conf-04", texto: "De acuerdo, hacemos el concierto el sábado 20.", esperado: "confirmation" },
  { id: "conf-05", texto: "Estamos de acuerdo con las condiciones. Cerramos la fecha.", esperado: "confirmation" },
  { id: "conf-06", lang: "en", texto: "Sounds great, we'd love to have you. Let's confirm the date.", esperado: "confirmation" },
  { id: "conf-07", texto: "Ok, adelante con el viernes 12.", esperado: "confirmation" },
  // Rechazo
  { id: "rech-01", texto: "Gracias por escribir, pero no estamos interesados por ahora.", esperado: "rejection" },
  { id: "rech-02", texto: "Lo sentimos, tenemos la programación completa hasta junio.", esperado: "rejection" },
  { id: "rech-03", texto: "Rechazamos la propuesta, no encaja con nuestra línea.", esperado: "rejection" },
  { id: "rech-04", texto: "No contratamos bandas de tributo. Un saludo.", esperado: "rejection" },
  { id: "rech-05", lang: "en", texto: "Thanks, but we are not interested at this time.", esperado: "rejection" },
  { id: "rech-06", lang: "fr", texto: "Merci, mais nous ne sommes pas intéressés pour le moment.", esperado: "rejection" },
  { id: "rech-07", texto: "No es posible, la sala está cerrada por reformas todo el trimestre.", esperado: "rejection" },
  // Precio / negociación
  { id: "prec-01", texto: "Nos interesa. ¿Cuál sería vuestro caché?", esperado: "price_negotiation" },
  { id: "prec-02", texto: "Sí, nos encaja, ¿cuánto cobráis por el concierto?", esperado: "price_negotiation" },
  { id: "prec-03", texto: "Nuestro presupuesto máximo es de 600 euros, ¿os sirve?", esperado: "price_negotiation" },
  { id: "prec-04", texto: "Podemos ofreceros 500€ y la taquilla. ¿Qué os parece?", esperado: "price_negotiation" },
  { id: "prec-05", texto: "¿Podéis bajar la tarifa un poco? Es una sala pequeña.", esperado: "price_negotiation" },
  { id: "prec-06", lang: "en", texto: "What is your fee for a 90 minute set?", esperado: "price_negotiation" },
  { id: "prec-07", lang: "fr", texto: "Quel est votre budget pour cette date ?", esperado: "price_negotiation" },
  { id: "prec-08", texto: "Genial, ¿cuál es vuestro caché para el sábado?", esperado: "price_negotiation" },
  // Seguimiento (piden más información, sin cerrar ni rechazar)
  { id: "seg-01", texto: "Hola, ¿podéis mandarnos un dossier y algún vídeo en directo?", esperado: "follow_up" },
  { id: "seg-02", texto: "¿Qué disponibilidad tenéis en marzo?", esperado: "follow_up" },
  { id: "seg-03", texto: "Antes de decidir, necesitaríamos más información sobre el rider técnico.", esperado: "follow_up" },
  { id: "seg-04", texto: "Gracias, lo comentamos con el equipo y os decimos algo.", esperado: "neutral" },
  // Neutral
  { id: "neu-01", texto: "Recibido, gracias.", esperado: "neutral" },
  { id: "neu-02", texto: "Hola, estoy fuera de la oficina hasta el lunes.", esperado: "neutral" },
  { id: "neu-03", texto: "Así que lo vemos complicado, pero os tenemos en cuenta.", esperado: "neutral" },
  { id: "neu-04", texto: "Nuestro departamento de booking os responderá en unos días.", esperado: "neutral" },
  { id: "neu-05", texto: "Gracias por vuestro interés.", esperado: "neutral" },
  // Texto citado: la respuesta propia no debe heredar palabras de lo que escribimos nosotros
  { id: "cita-01", texto: "Recibido, gracias." + CITA, esperado: "neutral" },
  { id: "cita-02", texto: "No estamos interesados." + CITA, esperado: "rejection" },
  { id: "cita-03", texto: "Perfecto, cerramos la fecha." + CITA, esperado: "confirmation" },
];

export interface ResultadoEval {
  total: number;
  aciertos: number;
  exactitud: number;
  fallos: Array<{ id: string; esperado: ResponseType; obtenido: ResponseType; conocido?: string }>;
  porClase: Record<string, { total: number; aciertos: number }>;
}

/** Clasifica el texto PROPIO del mensaje (sin lo citado), como hace el Lector. */
export function evaluarLector(casos: CasoLector[] = CASOS_LECTOR): ResultadoEval {
  const fallos: ResultadoEval["fallos"] = [];
  const porClase: ResultadoEval["porClase"] = {};
  let aciertos = 0;
  for (const c of casos) {
    const obtenido = detectResponseType(quitarTextoCitado(c.texto), c.lang);
    const clase = (porClase[c.esperado] ??= { total: 0, aciertos: 0 });
    clase.total++;
    if (obtenido === c.esperado) { aciertos++; clase.aciertos++; }
    else fallos.push({ id: c.id, esperado: c.esperado, obtenido, conocido: c.conocido });
  }
  return { total: casos.length, aciertos, exactitud: casos.length ? aciertos / casos.length : 1, fallos, porClase };
}
