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
    "CÓMO ESCRIBIR LOS TÍTULOS Y LOS TEXTOS (FRAMEWORK PROFESIONAL VIRAL 3.0):",
    "",
    "1. TÍTULO Y GANCHO VISUAL (HOOK ON-SCREEN 0-3s):",
    "   - \"hookText\": Rótulo sobreimpreso en pantalla para los primeros segundos: máximo 6 palabras.",
    "     Debe frenar el scroll instantáneamente (generar curiosidad, plantear una situación relatable o un reto).",
    "     Ejemplos: \"Cuando el público canta más fuerte\", \"Lo que nadie vio del ensayo\", \"Este solo costó 3 meses\".",
    "   - \"title\": Titular llamativo de alta conversión, describe lo que ocurre con chispa.",
    "",
    "2. VARIANTES DE COPY SEGÚN OBJETIVO ESTRATÉGICO:",
    `   - \"recommendedCopy\" / \"copyViral\": Modo Viral & Retención (TikTok/Reels). Breve, directo, humorístico o intrigante, diseñado para generar debate en comentarios.`,
    `   - \"copyComunidad\": Modo Comunidad & Lore. Narrativa cercana en primera persona de ${nombreBanda}, contando la historia del tema, del ensayo o del concierto para conectar con los fans.`,
    `   - \"copyConversion\": Modo Gira & Streaming. Orientado a conversión comercial con llamada a la acción (CTA) para escuchar en Spotify, pillar entradas o ir al EPK en la bio.`,
    "   - \"copyTikTok\": Variante ultra-corta (1-2 líneas) para TikTok / Shorts.",
    "   - \"copyYouTube\": Título optimizado para YouTube Shorts (máx 60 caracteres).",
    "   - \"copyFacebook\": Post algo más detallado (2-3 párrafos cortos).",
    "",
    "3. CATEGORIZACIÓN POR LONGITUD Y FORMATO:",
    "   - \"lengthCategory\": 'micro_hook' (7-15s para loops virales), 'hit_moment' (20-35s para clímax/estribillos), o 'story_bts' (40-60s para anécdotas/locales).",
    "",
    "4. HASHTAGS CLUSTERIZADOS:",
    "   - \"hashtags\": Entre 5 y 8 hashtags organizados en 3 capas (género/nicho de la banda, ciudad/escena local, y etiquetas de formato).",
    "",
    "5. CONTROL DE VOZ Y CERO CLICHÉS DE IA:",
    "   - PROHIBIDO el lenguaje corporativo o comodines vacíos: \"momento épico\", \"momentazo\", \"¡Hola a todos!\", \"No te pierdas esta joya\", \"Puro fuego\".",
    `   - Habla SIEMPRE en primera persona del plural (nosotros) desde la personalidad real de ${nombreBanda}.`,
    "   - Máximo 2 emojis bien elegidos, nada de ristras de emojis."
  ].join("\n");
}
