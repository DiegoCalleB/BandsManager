/**
 * Reglas de formato del Asesor de Marketing: qué tiene que cumplir cada pieza (reel, carrusel,
 * stories, post) según la red. Lógica pura, sin I/O, compartida entre el cliente (fichas de pieza)
 * y el servidor (prompt de generación y validación de lo que devuelve la IA).
 *
 * Cada regla cita su fuente: una lección del máster de marketing digital o `criterio-musica`, que
 * marca las adaptaciones propias al caso de una banda (el temario está pensado para negocios: allí
 * el audio es accesorio, aquí es el producto). Si el algoritmo cambia, se edita este fichero, no el
 * prompt.
 */

export type Formato = 'reel' | 'carrusel' | 'stories' | 'post';
export const REDES = ['instagram', 'tiktok', 'youtube'] as const;
/** `youtube` es YouTube Shorts: el reel vertical de la banda, publicado también allí. */
export type Red = (typeof REDES)[number];
/** Etapa del embudo: descubrimiento, consideración, decisión (lección de estrategia de IG). */
export type Embudo = 'tofu' | 'mofu' | 'bofu';

export type Fuente =
  | 'ig-creacion'
  | 'ig-estrategia'
  | 'ig-metricas'
  | 'tt-algoritmo'
  | 'tt-estrategia'
  | 'fb-contenidos'
  | 'yt-ctr'
  | 'criterio-musica';

export interface Regla {
  texto: string;
  fuente: Fuente;
}

export interface ReglasDeFormato {
  embudo: Embudo;
  /** Para qué sirve el formato, en una línea. */
  funcion: string;
  reglas: Regla[];
}

const ig = (texto: string): Regla => ({ texto, fuente: 'ig-creacion' });
const estrategia = (texto: string): Regla => ({ texto, fuente: 'ig-estrategia' });
const tt = (texto: string): Regla => ({ texto, fuente: 'tt-algoritmo' });
const ttEstrategia = (texto: string): Regla => ({ texto, fuente: 'tt-estrategia' });
const fb = (texto: string): Regla => ({ texto, fuente: 'fb-contenidos' });
const yt = (texto: string): Regla => ({ texto, fuente: 'yt-ctr' });
const musica = (texto: string): Regla => ({ texto, fuente: 'criterio-musica' });

export const REGLAS_FORMATO: Record<Formato, ReglasDeFormato> = {
  reel: {
    embudo: 'tofu',
    funcion: 'Que te descubra gente que no te sigue.',
    reglas: [
      ig('Gancho en los 3 primeros segundos, reforzado a la vez con texto en pantalla y con el audio.'),
      ig('Cuerpo sin relleno: ritmo rápido, cambios de plano y cumplir la promesa del gancho.'),
      ig('Cierra con una sola llamada a la acción clara: guardar, comentar una palabra o ir al enlace.'),
      musica('El gancho es musical: arranca en el mejor momento de la canción (estribillo, solo, el grito del público), nunca en la intro.'),
      musica('Si alguien habla a cámara, subtítulos siempre. Si solo suena música, texto en pantalla que cuente qué está pasando.'),
      ig('Mejor detrás de escena real que vídeo sobreproducido: lo humano convierte más.'),
    ],
  },
  carrusel: {
    embudo: 'mofu',
    funcion: 'Que te guarden y te conozcan más a fondo.',
    reglas: [
      ig('Contenido guardable: paso a paso o historia en orden, porque guardar es de lo que más premia el algoritmo.'),
      musica('Temas guardables de banda: la historia de una canción, cómo la grabasteis, el setlist explicado o el equipo del directo.'),
      ig('Storytelling del viaje del héroe: problema real, etapas de superación y transformación.'),
      ig('La primera slide es el gancho y la última, la llamada a la acción.'),
    ],
  },
  stories: {
    embudo: 'bofu',
    funcion: 'Fidelizar y llevar a la acción: entradas, presave, merch.',
    reglas: [
      estrategia('Presencia diaria: mantienen la relevancia ante el algoritmo.'),
      ig('Usa stickers de interacción (encuesta, pregunta, cuenta atrás): quien responde verá antes tus siguientes publicaciones.'),
      ig('Tono informal y humano. Aquí va el enlace directo a entradas o a la web.'),
      ig('Los destacados funcionan como menú, no como álbum: Conciertos, Música, Prensa y Contratación.'),
    ],
  },
  post: {
    embudo: 'mofu',
    funcion: 'Escaparate del perfil: anuncios y cartel.',
    reglas: [
      estrategia('El feed es un escaparate: coherencia visual con la identidad de la banda en cada miniatura.'),
      fb('Textos breves e impactantes: lo largo no se lee en el móvil.'),
      fb('Para que la gente participe sin encuestas nativas: "¿cuál tocamos de bis? Comenta A o B".'),
      fb('Si fijas un anuncio (concierto, oferta de merch), quítalo en cuanto pase la fecha.'),
      ig('Termina con una llamada a la acción clara.'),
    ],
  },
};

/** Lo que cambia en TikTok respecto a Instagram: buscador y retención mandan. */
export const REGLAS_TIKTOK: Regla[] = [
  tt('Retención: los 3 primeros segundos deciden si el vídeo sale del grupo de prueba.'),
  tt('SEO: palabra clave en la primera línea del texto y en una cartela de texto de los primeros segundos (TikTok la indexa).'),
  tt('Lo que más pesa: comentarios, guardados y compartidos.'),
  ttEstrategia('Hashtags integrados en la frase del texto, no amontonados al final.'),
  ttEstrategia('Estética nativa: texto y stickers de la propia app; lo grabado con el móvil rinde más que lo pulido.'),
  ttEstrategia('Efectos y filtros solo si siguen una tendencia o mejoran la historia.'),
  musica('Palabras clave que busca la gente: género + ciudad ("rock Madrid", "conciertos indie Valencia"), no el nombre de la banda.'),
];

/**
 * YouTube Shorts: el mismo vídeo vertical del reel, con título y descripción propios. Las reglas de
 * portada (arriba) ya vienen de la lección de CTR; lo de aquí es criterio propio hasta que haya una
 * lección específica de Shorts en el temario.
 */
export const REGLAS_YOUTUBE: Regla[] = [
  yt('El título abre una pregunta o una promesa y la portada la complementa; no repitas lo mismo en los dos.'),
  musica('Título corto (hasta unos 60-70 caracteres, para que no se corte en el móvil) y con la palabra clave primero: género y ciudad, o el nombre de la canción.'),
  musica('El texto de YouTube tiene dos partes: primera línea = título; después de una línea en blanco, la descripción.'),
  musica('Descripción: una o dos frases con la palabra clave y, si existe, el enlace a la canción o a las entradas. Nada de párrafos.'),
  musica('Una sola idea y el mejor momento de la canción desde el primer segundo; YouTube premia que se vea entero.'),
  musica('Cierra pidiendo UNA cosa (suscribirse o ver el siguiente vídeo), no varias.'),
];

/**
 * Portada de un reel o miniatura de un Short: lo que decide el clic (lección de CTR de YouTube).
 * También cuenta en la cuadrícula del perfil de Instagram.
 */
export const REGLAS_PORTADA: Regla[] = [
  yt('Máximo 3-4 palabras en la imagen, y que no repitan el título: la portada abre la pregunta y el título la cierra.'),
  yt('Contraste fuerte (color eléctrico sobre fondo oscuro o al revés) y legible en el móvil.'),
  yt('Si sale una cara, que tenga una emoción evidente; una cara neutra resta.'),
  yt('Un elemento visual recurrente (logo, color, marco) para que la reconozcan en el scroll.'),
  yt('En títulos de lista, mejor 3 o 7 que números pares.'),
];

/** Frecuencia de referencia para crecer; el asesor la escala a las horas reales de la banda. */
export const FRECUENCIA_CRECIMIENTO: Record<Red, { piezasSemana: [number, number]; fuente: Fuente }> = {
  instagram: { piezasSemana: [3, 4], fuente: 'ig-estrategia' },
  tiktok: { piezasSemana: [3, 5], fuente: 'tt-estrategia' },
  // Criterio propio mientras no haya lección de Shorts: con los mismos vídeos que ya hacen para reels, 1-2 a la semana.
  youtube: { piezasSemana: [1, 2], fuente: 'criterio-musica' },
};
/** Además de las piezas: stories todos los días (lección de estrategia de IG). */
export const STORIES_DIARIAS = true;

/**
 * Mezcla de contenido (lección de contenidos de FB): una audiencia que solo recibe promoción se
 * vuelve ciega a la marca. El límite numérico es criterio propio; el temario solo dice "no saturar".
 */
export type TipoContenido = 'promocional' | 'humano' | 'emocional' | 'cultural' | 'educativo' | 'participativo';
export const MAX_PROMOCIONAL = 1 / 3;

/** ¿Se pasa de promoción el plan? Sirve para que el planificador intercale otros tipos. */
export function demasiadaPromocion(tipos: TipoContenido[]): boolean {
  return tipos.length > 0 && tipos.filter((t) => t === 'promocional').length / tipos.length > MAX_PROMOCIONAL;
}

/** Etiquetas que no aportan nada a la distribución y gastan espacio (TikTok: #fyp; IG: genéricas masivas). */
const HASHTAGS_VACIOS = new Set([
  'fyp', 'foryou', 'foryoupage', 'parati', 'viral', 'reels', 'reel', 'instagood', 'music', 'musica', 'music🎵',
]);

/** Cuántos hashtags específicos usar: IG 3-5, TikTok 2-3. */
export const LIMITE_HASHTAGS: Record<Red, { min: number; max: number }> = {
  instagram: { min: 3, max: 5 },
  tiktok: { min: 2, max: 3 },  // 2-3 (algoritmo) y 3 óptimo (estrategia): el máximo coincide
  youtube: { min: 2, max: 3 },  // YouTube enseña los tres primeros encima del título
};

/**
 * Limpia los hashtags que propone la IA: quita los genéricos, normaliza, deduplica y recorta al
 * máximo de la red. No rellena hasta el mínimo: mejor 2 buenos que 3 con uno inventado.
 */
export function sanearHashtags(tags: unknown, red: Red): string[] {
  if (!Array.isArray(tags)) return [];
  const limpios: string[] = [];
  for (const t of tags) {
    if (typeof t !== 'string') continue;
    const tag = t.trim().replace(/^#+/, '').replace(/\s+/g, '');
    if (!tag || tag.length > 40 || HASHTAGS_VACIOS.has(tag.toLowerCase())) continue;
    if (limpios.some((x) => x.toLowerCase() === tag.toLowerCase())) continue;
    limpios.push(tag);
  }
  return limpios.slice(0, LIMITE_HASHTAGS[red].max).map((t) => `#${t}`);
}

/** Bloque de reglas listo para el prompt de generación de una pieza. */
export function bloqueReglasPrompt(formato: Formato, red: Red): string {
  const f = REGLAS_FORMATO[formato];
  const esVideo = formato === 'reel';
  const reglas = [...f.reglas, ...(esVideo && red === 'tiktok' ? REGLAS_TIKTOK : []), ...(esVideo && red === 'youtube' ? REGLAS_YOUTUBE : []), ...(esVideo ? REGLAS_PORTADA : [])];
  const { min, max } = LIMITE_HASHTAGS[red];
  return [
    `Formato: ${formato} en ${red === 'youtube' ? 'YouTube Shorts' : red}. Función: ${f.funcion}`,
    ...reglas.map((r) => `- ${r.texto}`),
    `- Entre ${min} y ${max} hashtags muy específicos del nicho; nunca genéricos (#fyp, #viral, #music).`,
  ].join('\n');
}
