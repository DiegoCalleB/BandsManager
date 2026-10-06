// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

/**
 * Qué buscar y cómo titularlo, según cómo esté grabado el material.
 *
 * El prompt anterior era el mismo para todo, y pedía cosas genéricas ("identifica fragmentos
 * con potencial de enganche"). Con eso el modelo devolvía títulos intercambiables del tipo
 * "Momento épico de la banda", que no dicen nada y no ayudan a elegir.
 *
 * Un corte de un bolo y un corte de un videoclip no se buscan igual ni se titulan igual, así
 * que aquí vive esa diferencia, separada del prompt para poder probarla.
 */

import type { TipoContenido } from "./viralSignals.js";

export interface EstrategiaContenido {
  /** Cómo se llama a este material en el prompt. */
  etiqueta: string;
  /** Qué momentos hay que buscar en este tipo de vídeo. */
  queBuscar: string[];
  /** Qué NO funciona en este tipo de vídeo. */
  queEvitar: string[];
  /** Ejemplos de títulos concretos, del estilo que sí sirve. */
  ejemplosTitulo: string[];
}

const ESTRATEGIAS: Record<TipoContenido, EstrategiaContenido> = {
  concierto: {
    etiqueta: "CONCIERTO / DIRECTO",
    queBuscar: [
      "El instante exacto en que entra la banda al completo después de una parte tranquila: el contraste es lo que frena el scroll.",
      "La reacción del público: saltos, coros, palmas, gente cantando la letra.",
      "El final de un tema, con el estallido y el aplauso encima.",
      "Un momento de interacción con la gente (hablar al público, hacer callar a la sala, pedir palmas)."
    ],
    queEvitar: [
      "Afinaciones, silencios entre temas y presentaciones largas.",
      "Tramos donde el sonido de la grabación está saturado o embarullado sin nada reconocible."
    ],
    ejemplosTitulo: [
      "Cuando entra la batería y se viene abajo la sala",
      "El público cantando el estribillo entero",
      "Último acorde y la sala explotando"
    ]
  },
  videoclip: {
    etiqueta: "VIDEOCLIP",
    queBuscar: [
      "El estribillo: en un videoclip es casi siempre el fragmento más reconocible y el que mejor funciona suelto.",
      "El plano visualmente más potente o más raro, aunque no sea el momento más alto de volumen.",
      "La entrada del tema o un cambio de sección con un corte de montaje marcado."
    ],
    queEvitar: [
      "Los primeros segundos si son créditos, silencio o un fundido de entrada.",
      "Tramos de transición sin voz ni gancho visual."
    ],
    ejemplosTitulo: [
      "El estribillo que se queda pegado",
      "Este plano del videoclip a cámara lenta",
      "Los 3 segundos que resumen el tema"
    ]
  },
  ensayo: {
    etiqueta: "ENSAYO / LOCAL",
    queBuscar: [
      "El momento en que la canción arranca de verdad después de las cuentas y las pruebas.",
      "Un error con risas o un momento espontáneo: en material de local, lo humano funciona mejor que lo perfecto.",
      "Un fragmento tocado con ganas, aunque el sonido sea crudo: la autenticidad es el argumento aquí."
    ],
    queEvitar: [
      "Cuentas, afinaciones, ajustes de sonido y conversaciones sueltas.",
      "Vender un ensayo como si fuera un directo: se nota y resta credibilidad."
    ],
    ejemplosTitulo: [
      "El tema nuevo sonando por primera vez en el local",
      "Sale mal, nos reímos y sale mejor",
      "Así suena antes de pisar un escenario"
    ]
  },
  otro: {
    etiqueta: "VÍDEO DE LA BANDA",
    queBuscar: [
      "El punto donde cambia algo de forma clara: entra la música, sube la energía, aparece alguien.",
      "Cualquier tramo con un gancho reconocible en los dos primeros segundos."
    ],
    queEvitar: [
      "Introducciones lentas, silencios y tramos sin nada que ocurra."
    ],
    ejemplosTitulo: [
      "El momento en que arranca de verdad",
      "Justo aquí cambia todo"
    ]
  }
};

export function estrategiaDe(tipo: TipoContenido): EstrategiaContenido {
  return ESTRATEGIAS[tipo] || ESTRATEGIAS.otro;
}

/**
 * Bloque de estrategia para el prompt: qué buscar, qué evitar y cómo se ve un buen título
 * en ESTE tipo de material.
 */
export function buildEstrategiaBlock(tipo: TipoContenido): string {
  const e = estrategiaDe(tipo);
  return [
    `TIPO DE MATERIAL: ${e.etiqueta}.`,
    "",
    "QUÉ BUSCAR EN ESTE TIPO DE VÍDEO:",
    ...e.queBuscar.map((q) => `- ${q}`),
    "",
    "QUÉ NO ELEGIR:",
    ...e.queEvitar.map((q) => `- ${q}`),
    "",
    "EJEMPLOS DEL ESTILO DE TÍTULO QUE SÍ SIRVE (imita la concreción, no las palabras):",
    ...e.ejemplosTitulo.map((t) => `- "${t}"`)
  ].join("\n");
}

/**
 * Reglas de redacción, comunes a todos los tipos.
 *
 * Son en negativo a propósito: el problema no era que el modelo escribiera mal, sino que
 * escribía relleno intercambiable. Prohibir explícitamente los comodines es lo que fuerza
 * a decir algo concreto de ESE tramo.
 */
export function buildReglasDeRedaccion(nombreBanda: string): string {
  return [
    "CÓMO ESCRIBIR LOS TÍTULOS Y LOS TEXTOS:",
    "",
    "1. El título describe LO QUE PASA en ese tramo concreto, no lo bueno que es. Alguien que no",
    "   haya visto el vídeo tiene que poder distinguir un corte de otro solo por el título. Pero",
    "   tiene que enganchar de verdad: redáctalo como un titular que da ganas de dar al play (una",
    "   pregunta, una promesa, un contraste), no como una etiqueta neutra o un pie de foto. Si hay",
    "   un ADN DE VOZ analizado arriba, el título es el sitio número uno donde debe notarse: usa su",
    "   vocabulario y su energía, no un titular que le serviría igual a cualquier otra banda.",
    "2. PROHIBIDO usar comodines vacíos: \"momento épico\", \"momentazo\", \"increíble\", \"brutal\",",
    "   \"espectacular\", \"no te lo pierdas\", \"esto es una locura\", \"energía pura\", \"puro fuego\".",
    "   Si un título funcionaría igual pegado a otro vídeo cualquiera, está mal.",
    "3. Nada de clickbait que el corte no cumpla. Si el título promete algo, tiene que verse.",
    "4. El \"hookText\" es un rótulo que va sobreimpreso en pantalla los 2 primeros segundos:",
    "   máximo 6 palabras, en mayúsculas o minúsculas naturales, sin punto final. Debe dar una",
    "   razón para quedarse (una promesa, una pregunta, un dato), no describir la escena.",
    `5. Los copies van en la voz de ${nombreBanda}, en primera persona del plural. Nada de hablar`,
    "   de la banda en tercera persona como si fuera una nota de prensa.",
    "6. \"reason\" es para ti y para el usuario, no para publicar: explica en una frase por qué",
    "   ESE tramo y no otro, citando la señal medida o la letra que lo justifica.",
    "7. Español de España, natural. Sin exclamaciones en cadena. Si hay un ADN DE VOZ analizado",
    "   arriba, sigue su cantidad real de emojis y su vocabulario en vez de esta regla; si no hay",
    "   ADN de voz, no pongas más de 2 emojis por copy."
  ].join("\n");
}
