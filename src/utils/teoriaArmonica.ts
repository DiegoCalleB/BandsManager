/**
 * Teoría armónica determinista para el «profesor de armonía»: grado romano de cada acorde, su
 * función (tónica / subdominante / dominante / color modal / ajeno), modo de la canción,
 * progresiones con nombre y escalas sugeridas por acorde.
 *
 * Todo es código puro y comprobable (sin IA): mismo cifrado → mismo análisis. La IA solo redacta
 * encima de estos hechos (docs/plan-armonia-didactica.md).
 *
 * Convención de los grados: relativos a la escala MAYOR de la tónica, con bemoles/sostenidos
 * (la de rock, pop y jazz): en La menor, Sol es «bVII», Fa es «bVI» y Do es «bIII». Mayúscula =
 * acorde mayor, minúscula = menor; ° disminuido, + aumentado.
 */

export type Funcion = 'T' | 'S' | 'D' | 'M' | 'X';

export const NOMBRE_FUNCION: Record<Funcion, string> = {
  T: 'Tónica',
  S: 'Subdominante',
  D: 'Dominante',
  M: 'Color modal',
  X: 'Ajeno a la tonalidad',
};

/** Qué sensación da cada función (para la leyenda y las explicaciones). */
export const SENSACION_FUNCION: Record<Funcion, string> = {
  T: 'reposo: la casa',
  S: 'movimiento: te aleja de casa',
  D: 'tensión: pide volver a casa',
  M: 'color: acorde prestado de otro modo',
  X: 'fuera de la tonalidad: sorpresa o cambio de tono',
};

export const NOTAS_SOST = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const NOTAS_BEMOL = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const ES: Record<string, string> = { C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si' };

/** Nombre de una nota (0-11) en notación inglesa o española, con sostenidos o bemoles. */
export function nombreDeNota(pc: number, bemoles: boolean, notacion: 'ES' | 'EN' = 'EN'): string {
  const n = (bemoles ? NOTAS_BEMOL : NOTAS_SOST)[((pc % 12) + 12) % 12];
  return notacion === 'ES' ? ES[n[0]] + n.slice(1) : n;
}

// ── Acordes y tonalidades ──────────────────────────────────────────────────────────────────────

export interface AcordeParseado {
  raiz: number;
  bajo: number | null;
  menor: boolean;
  disminuido: boolean;
  aumentado: boolean;
  sus: boolean;
  septima: null | '7' | 'maj7';
}

const PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function pcDe(nota: string): number | null {
  const m = /^([A-G])([#b]?)$/.exec(nota);
  if (!m) return null;
  return (PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12;
}

/** Acorde en notación internacional («F#m7», «Bb», «C/E», «Gsus4», «Bdim») → sus partes; null si no lo es. */
export function parseAcorde(acorde: string): AcordeParseado | null {
  const m = /^([A-G][#b]?)([^/]*)(?:\/([A-G][#b]?))?$/.exec((acorde || '').trim());
  if (!m) return null;
  const raiz = pcDe(m[1]);
  if (raiz === null) return null;
  const s = m[2];
  const disminuido = /^(dim|°|m7b5|ø)/.test(s);
  const aumentado = /^(aug|\+)/.test(s);
  const menor = !disminuido && (/^m(?!aj)/.test(s) || /^min/.test(s));
  const septima: AcordeParseado['septima'] = /maj7|Δ|M7/.test(s) ? 'maj7' : /7/.test(s) ? '7' : null;
  return { raiz, bajo: m[3] ? pcDe(m[3]) : null, menor, disminuido, aumentado, sus: /sus/.test(s), septima };
}

export interface Tonalidad {
  tonica: number;
  menor: boolean;
  /** «E», «F#m»… (sostenidos, notación internacional). */
  nombre: string;
}

const ES_A_EN: Record<string, string> = { do: 'C', re: 'D', mi: 'E', fa: 'F', sol: 'G', la: 'A', si: 'B' };

/** «E», «Em», «F#m», «Bb», «Mi», «Lam», «Do#m» → tonalidad; null si no se reconoce. */
export function parseTonalidad(texto: string | null | undefined): Tonalidad | null {
  const t = (texto ?? '').trim();
  if (!t) return null;
  let nota: string;
  let resto: string;
  const es = /^(do|re|mi|fa|sol|la|si)([#b]?)(.*)$/i.exec(t);
  const en = /^([A-G])([#b]?)(.*)$/.exec(t);
  if (es) {
    nota = ES_A_EN[es[1].toLowerCase()] + es[2];
    resto = es[3];
  } else if (en) {
    nota = en[1] + en[2];
    resto = en[3];
  } else return null;
  const tonica = pcDe(nota);
  if (tonica === null) return null;
  const menor = /^\s*(m(?!aj)|min|menor)/i.test(resto);
  return { tonica, menor, nombre: NOTAS_SOST[tonica] + (menor ? 'm' : '') };
}

// ── Grado romano ───────────────────────────────────────────────────────────────────────────────

const GRADOS = ['I', 'bII', 'II', 'bIII', 'III', 'IV', '#IV', 'V', 'bVI', 'VI', 'bVII', 'VII'];

/** Grado romano de un acorde respecto a una tónica: «I», «bVII», «vi», «V7», «ii°», «IVmaj7»… */
export function gradoRomano(acorde: string, tonica: number): string | null {
  const a = parseAcorde(acorde);
  if (!a) return null;
  const base = GRADOS[(a.raiz - tonica + 12) % 12];
  const m = /^([#b]?)([IV]+)$/.exec(base) as RegExpExecArray;
  const minuscula = a.menor || a.disminuido;
  let g = m[1] + (minuscula ? m[2].toLowerCase() : m[2]);
  if (a.disminuido) g += '°';
  else if (a.aumentado) g += '+';
  if (a.sus) g += 'sus';
  if (a.septima === 'maj7') g += 'maj7';
  else if (a.septima === '7') g += '7';
  return g;
}

// ── Función armónica ───────────────────────────────────────────────────────────────────────────

type Calidad = 'maj' | 'min' | 'dim';
const calidadDe = (a: AcordeParseado): Calidad => (a.disminuido ? 'dim' : a.menor ? 'min' : 'maj');

/** Función de un acorde por su intervalo sobre la tónica y su calidad, según la tonalidad sea mayor o menor. */
export function funcionDeIntervalo(intervalo: number, calidad: Calidad, tonalidadMenor: boolean): Funcion {
  const k = `${intervalo}${calidad}`;
  if (!tonalidadMenor) {
    switch (k) {
      case '0maj': case '4min': case '9min': return 'T';
      case '2min': case '5maj': return 'S';
      case '7maj': case '11dim': return 'D';
      case '10maj': case '3maj': case '8maj': case '5min': case '1maj': case '7min': case '0min': return 'M';
      case '2maj': case '9maj': case '4maj': case '11min': case '2dim': return 'X';
      default: return 'X';
    }
  }
  switch (k) {
    case '0min': case '3maj': return 'T';
    case '5min': case '8maj': case '2dim': return 'S';
    case '7maj': case '7min': case '10maj': case '11dim': return 'D';
    case '0maj': case '5maj': case '1maj': case '9dim': return 'M';
    default: return 'X';
  }
}

export interface AcordeAnalizado {
  acorde: string;
  grado: string;
  funcion: Funcion;
  /** Si es un dominante secundario: «V/vi», «V/V»… (su función pasa a ser D). */
  secundario?: string;
}

/**
 * Analiza un acorde dentro de una tonalidad. `siguiente` permite reconocer dominantes secundarios
 * (un acorde mayor/7 ajeno a la tonalidad cuya raíz está una quinta por encima del siguiente).
 */
export function analizarAcorde(acorde: string, tonalidad: Tonalidad, siguiente?: string | null): AcordeAnalizado | null {
  const a = parseAcorde(acorde);
  if (!a) return null;
  const grado = gradoRomano(acorde, tonalidad.tonica) as string;
  const intervalo = (a.raiz - tonalidad.tonica + 12) % 12;
  let funcion = funcionDeIntervalo(intervalo, calidadDe(a), tonalidad.menor);
  // Mayor aumentado/sus: se tratan por su raíz como el acorde mayor (el color lo da la extensión).
  let secundario: string | undefined;
  if (funcion === 'X' && !a.menor && !a.disminuido && siguiente) {
    const s = parseAcorde(siguiente);
    if (s && (a.raiz - s.raiz + 12) % 12 === 7) {
      const gSig = gradoRomano(siguiente, tonalidad.tonica) as string;
      const fSig = funcionDeIntervalo((s.raiz - tonalidad.tonica + 12) % 12, calidadDe(s), tonalidad.menor);
      if (fSig !== 'X' && gSig !== 'I' && gSig !== 'i') {
        secundario = `V/${gSig.replace(/(maj7|7|sus)$/, '')}`;
        funcion = 'D';
      }
    }
  }
  return { acorde, grado, funcion, ...(secundario ? { secundario } : {}) };
}

// ── Tonalidad estimada y modo ──────────────────────────────────────────────────────────────────

export interface TramoAcorde {
  t0: number;
  t1: number;
  acorde: string;
}

const MAYOR = [0, 2, 4, 5, 7, 9, 11];

/** Acordes diatónicos (tríadas) de una tonalidad mayor/menor natural, como conjunto de «raíz+calidad». */
function diatonicos(t: Tonalidad): Set<string> {
  const base = t.menor ? (t.tonica + 3) % 12 : t.tonica; // la mayor relativa
  const calidades: Calidad[] = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'];
  return new Set(MAYOR.map((g, i) => `${(base + g) % 12}${calidades[i]}`));
}

/**
 * Tonalidad que mejor explica los acordes: puntúa el tiempo de acordes diatónicos, premia a la
 * tónica y desempata (relativas, p. ej. Do/Lam) con el primer y el último acorde, que casi siempre
 * son la tónica. Devuelve null si no hay material.
 */
export function estimarTonalidad(tramos: TramoAcorde[]): Tonalidad | null {
  const reales = tramos.filter((s) => s.acorde !== 'N' && parseAcorde(s.acorde));
  if (reales.length < 2) return null;
  const primero = parseAcorde(reales[0].acorde)!;
  const ultimo = parseAcorde(reales[reales.length - 1].acorde)!;
  let mejor: { t: Tonalidad; puntos: number } | null = null;
  for (let tonica = 0; tonica < 12; tonica++) {
    for (const menor of [false, true]) {
      const t: Tonalidad = { tonica, menor, nombre: NOTAS_SOST[tonica] + (menor ? 'm' : '') };
      const diat = diatonicos(t);
      let puntos = 0;
      for (const s of reales) {
        const a = parseAcorde(s.acorde)!;
        const dur = Math.max(0.01, s.t1 - s.t0);
        if (diat.has(`${a.raiz}${calidadDe(a)}`)) puntos += dur;
        // Rock/blues: los acordes mayores sobre la tónica o la cuarta y quinta cuentan aunque la tonalidad sea mayor.
        if (a.raiz === tonica) puntos += 0.6 * dur;
      }
      const total = reales.reduce((x, s) => x + Math.max(0.01, s.t1 - s.t0), 0);
      // Desempate (≤ 2 % del total): primero y último acorde.
      if (primero.raiz === tonica && (primero.menor === menor || !menor)) puntos += 0.012 * total;
      if (ultimo.raiz === tonica && (ultimo.menor === menor || !menor)) puntos += 0.012 * total;
      if (!mejor || puntos > mejor.puntos) mejor = { t, puntos };
    }
  }
  return mejor ? mejor.t : null;
}

export type ModoId = 'jonico' | 'mixolidio' | 'lidio' | 'eolico' | 'dorico' | 'frigio';

export interface Modo {
  id: ModoId;
  nombre: string;
  /** Una frase que explica qué lo distingue. */
  rasgo: string;
}

const MODOS: Record<ModoId, { nombre: string; rasgo: string }> = {
  jonico: { nombre: 'mayor (jónico)', rasgo: 'la escala mayor de siempre: luminosa y estable' },
  mixolidio: { nombre: 'mixolidio', rasgo: 'mayor con séptima menor (bVII): sonido de rock y blues, sin tensión de sensible' },
  lidio: { nombre: 'lidio', rasgo: 'mayor con cuarta aumentada (#IV): sonido etéreo, de cine' },
  eolico: { nombre: 'menor natural (eólico)', rasgo: 'el menor «de toda la vida»: oscuro y melancólico' },
  dorico: { nombre: 'dórico', rasgo: 'menor con sexta mayor: menor pero con luz, típico del funk y el rock modal' },
  frigio: { nombre: 'frigio', rasgo: 'menor con segunda menor (bII): sonido flamenco y de metal' },
};

/** Desplazamiento de la tónica de cada modo hasta la tónica de su escala mayor «padre». */
const DESPL_PADRE: Record<ModoId, number> = { jonico: 0, mixolidio: 5, lidio: 7, eolico: 3, dorico: 10, frigio: 8 };

/**
 * Modo de la canción dentro de su tonalidad: mira qué grados «de color» aparecen y cuánto pesan
 * (bVII → mixolidio, #IV → lidio, IV mayor en menor → dórico, bII → frigio).
 */
export function estimarModo(tramos: TramoAcorde[], t: Tonalidad): Modo {
  const total = tramos.filter((s) => s.acorde !== 'N').reduce((x, s) => x + Math.max(0.01, s.t1 - s.t0), 0) || 1;
  const peso = (pred: (intervalo: number, a: AcordeParseado) => boolean) =>
    tramos.reduce((x, s) => {
      const a = s.acorde === 'N' ? null : parseAcorde(s.acorde);
      return a && pred((a.raiz - t.tonica + 12) % 12, a) ? x + Math.max(0.01, s.t1 - s.t0) : x;
    }, 0) / total;
  let id: ModoId;
  if (!t.menor) {
    // Lidio: #IV, o el II mayor sin dominante que lo explique (C–D–C–D: el D no «resuelve» a G).
    if (peso((i, a) => i === 6 && !a.menor) > 0.04 || (peso((i, a) => i === 2 && !a.menor) > 0.1 && peso((i) => i === 7) < 0.05)) id = 'lidio';
    else if (peso((i, a) => i === 10 && !a.menor) > 0.05 && peso((i, a) => i === 11) < 0.02) id = 'mixolidio';
    else id = 'jonico';
  } else {
    if (peso((i, a) => i === 1 && !a.menor) > 0.04) id = 'frigio';
    else if (peso((i, a) => i === 5 && !a.menor) > 0.05 && peso((i, a) => i === 5 && a.menor) < 0.02) id = 'dorico';
    else id = 'eolico';
  }
  return { id, ...MODOS[id] };
}

// ── Progresiones con nombre ────────────────────────────────────────────────────────────────────

const PROGRESIONES_CON_NOMBRE: Record<string, string> = {
  'I-V-vi-IV': 'la progresión «eje» del pop (I–V–vi–IV)',
  'vi-IV-I-V': 'una rotación de la progresión «eje» del pop (vi–IV–I–V)',
  'I-vi-IV-V': 'la progresión de los años 50 (I–vi–IV–V)',
  'I-IV-V': 'la base del rock y del blues (I–IV–V)',
  'I-IV-V-IV': 'la base del rock con vuelta (I–IV–V–IV)',
  'I-V-IV': 'I–V–IV, típica del rock sureño',
  'I-IV-I-V': 'I–IV–I–V, rock y country',
  'I-bVII-IV': 'rock mixolidio (I–bVII–IV)',
  'I-IV-bVII': 'rock mixolidio (I–IV–bVII), como «Born to Be Wild»',
  'I-bVII-IV-I': 'rock mixolidio (I–bVII–IV–I)',
  'I-IV-bVII-IV': 'rock mixolidio (I–IV–bVII–IV)',
  'i-bVII-bVI-V': 'la cadencia andaluza (i–bVII–bVI–V)',
  'i-bVII-bVI-bVII': 'una vuelta menor modal (i–bVII–bVI–bVII)',
  'i-bVI-bIII-bVII': 'la progresión épica menor (i–bVI–bIII–bVII)',
  'i-bVII-bVI-bVII-i': 'una vuelta menor modal',
  'i-iv-v': 'el menor básico (i–iv–v)',
  'i-iv-V': 'el menor con dominante mayor (i–iv–V)',
  'i-bVII-iv': 'rock menor (i–bVII–iv)',
  'ii-V-I': 'la cadencia de jazz (ii–V–I)',
  'ii7-V7-Imaj7': 'la cadencia de jazz (ii–V–I)',
  'I-iii-IV-V': 'I–iii–IV–V, balada clásica',
  'I-ii-IV-V': 'I–ii–IV–V',
  'I-IV-vi-V': 'I–IV–vi–V, pop-rock',
  'I-V-vi-iii-IV': 'el canon de Pachelbel (I–V–vi–iii–IV)',
};

function nombreProgresion(secuencia: string[]): { nombre: string | null; rotacion: number } {
  const norm = (g: string) => g.replace(/(maj7|7|sus)$/, '');
  const s = secuencia.map(norm);
  for (let r = 0; r < s.length; r++) {
    const rot = [...s.slice(r), ...s.slice(0, r)].join('-');
    if (PROGRESIONES_CON_NOMBRE[rot]) return { nombre: PROGRESIONES_CON_NOMBRE[rot], rotacion: r };
  }
  return { nombre: null, rotacion: 0 };
}

export interface Bucle {
  /** Grados del bucle, empezando por el acorde en el que más suele empezar. */
  grados: string[];
  /** Cuántas veces se repite entero a lo largo de la canción. */
  veces: number;
  /** Fracción (0-1) de los cambios de acorde que encajan con el bucle. */
  cobertura: number;
  nombre: string | null;
}

/** Busca el bucle armónico (2 a 8 acordes) que más se repite en la secuencia de grados. */
export function encontrarBucle(grados: string[]): Bucle | null {
  const sec = grados.filter((g, i) => i === 0 || g !== grados[i - 1]);
  if (sec.length < 4) return null;
  // El periodo MÁS CORTO que cubre al menos el 70 % de los cambios; con ese periodo, la ventana
  // (rotación) que más encaja y, a igualdad, la que empieza en la tónica.
  for (let p = 2; p <= Math.min(8, Math.floor(sec.length / 2)); p++) {
    let mejor: { offset: number; encaja: number; tonica: boolean } | null = null;
    for (let offset = 0; offset < p; offset++) {
      const ventana = sec.slice(offset, offset + p);
      let encaja = 0;
      for (let i = offset; i < sec.length; i++) if (sec[i] === ventana[(i - offset) % p]) encaja++;
      const tonica = /^[Ii]$/.test(ventana[0]);
      if (!mejor || encaja > mejor.encaja || (encaja === mejor.encaja && tonica && !mejor.tonica)) mejor = { offset, encaja, tonica };
    }
    if (mejor && mejor.encaja / sec.length >= 0.7) {
      let ventana = sec.slice(mejor.offset, mejor.offset + p);
      const { nombre, rotacion } = nombreProgresion(ventana);
      if (nombre && rotacion > 0) ventana = [...ventana.slice(rotacion), ...ventana.slice(0, rotacion)];
      return { grados: ventana, veces: Math.floor(sec.length / p), cobertura: Math.round((mejor.encaja / sec.length) * 100) / 100, nombre };
    }
  }
  return null;
}

// ── Notas y escalas ────────────────────────────────────────────────────────────────────────────

const ESCALAS: Record<string, number[]> = {
  mayor: [0, 2, 4, 5, 7, 9, 11],
  pentMayor: [0, 2, 4, 7, 9],
  pentMenor: [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10],
};

const NOMBRE_MODO_ESCALA = ['jónico', 'dórico', 'frigio', 'lidio', 'mixolidio', 'eólico', 'locrio'];

export interface EscalaSugerida {
  nombre: string;
  /** Notas como pitch classes 0-11, desde la raíz. */
  notas: number[];
  raiz: number;
  motivo: string;
}

const escala = (raiz: number, intervalos: number[]) => intervalos.map((i) => (raiz + i) % 12);

/** ¿Usa bemoles la escala mayor «padre» de esta tonalidad? (F, Bb, Eb, Ab, Db, Gb y sus relativas) */
export function usaBemoles(t: Tonalidad, modo: ModoId = t.menor ? 'eolico' : 'jonico'): boolean {
  const padre = (t.tonica + DESPL_PADRE[modo]) % 12;
  return [5, 10, 3, 8, 1, 6].includes(padre);
}

/**
 * Hasta tres escalas para improvisar sobre un acorde en su contexto: el modo que le toca dentro de
 * la escala de la canción, la pentatónica del acorde y, si pega, la de blues de la tónica.
 */
export function escalasSugeridas(acorde: string, t: Tonalidad, modo: ModoId): EscalaSugerida[] {
  const a = parseAcorde(acorde);
  if (!a) return [];
  const salida: EscalaSugerida[] = [];
  const padre = (t.tonica + DESPL_PADRE[modo]) % 12;
  const escalaPadre = escala(padre, ESCALAS.mayor);
  const idx = escalaPadre.indexOf(a.raiz);
  if (idx >= 0) {
    // Modo que empieza en la raíz del acorde dentro de la escala de la canción.
    const gradoEscala = MAYOR.indexOf((a.raiz - padre + 12) % 12);
    const notas = escalaPadre.slice(gradoEscala).concat(escalaPadre.slice(0, gradoEscala));
    salida.push({
      nombre: `{R} ${NOMBRE_MODO_ESCALA[gradoEscala]}`,
      raiz: a.raiz,
      notas,
      motivo: 'las mismas notas de la tonalidad, empezando en este acorde: suena «dentro»',
    });
  } else {
    salida.push({
      nombre: a.menor ? '{R} dórico' : '{R} mixolidio',
      raiz: a.raiz,
      notas: escala(a.raiz, a.menor ? [0, 2, 3, 5, 7, 9, 10] : [0, 2, 4, 5, 7, 9, 10]),
      motivo: 'este acorde es prestado de otro modo: toca su propia escala para que suene a propósito',
    });
  }
  salida.push({
    nombre: a.menor || a.disminuido ? 'Pentatónica menor de {R}' : 'Pentatónica mayor de {R}',
    raiz: a.raiz,
    notas: escala(a.raiz, a.menor || a.disminuido ? ESCALAS.pentMenor : ESCALAS.pentMayor),
    motivo: 'cinco notas que rara vez chocan: la apuesta segura para improvisar',
  });
  const rock = (modo === 'mixolidio' || modo === 'jonico') && !t.menor;
  if ((rock && a.raiz === t.tonica) || (t.menor && a.raiz === t.tonica)) {
    salida.push({
      nombre: 'Blues de {R}',
      raiz: a.raiz,
      notas: escala(a.raiz, ESCALAS.blues),
      motivo: 'la pentatónica menor con la «nota azul»: el sonido clásico del blues-rock sobre la tónica',
    });
  }
  return salida.slice(0, 3);
}

export interface NotasAcorde {
  raiz: number;
  tercera: number | null;
  quinta: number;
  septima: number | null;
  /** Las que «dibujan» el acorde: tercera y séptima. */
  guia: number[];
}

/** Notas del acorde y notas guía (3.ª y 7.ª). La 7.ª sale si el acorde la lleva; si no, la de su función. */
export function notasDelAcorde(acorde: string, funcion?: Funcion): NotasAcorde | null {
  const a = parseAcorde(acorde);
  if (!a) return null;
  const tercera = a.sus ? null : (a.raiz + (a.menor || a.disminuido ? 3 : 4)) % 12;
  const quinta = (a.raiz + (a.disminuido ? 6 : a.aumentado ? 8 : 7)) % 12;
  let septima: number | null = null;
  if (a.septima === 'maj7') septima = (a.raiz + 11) % 12;
  else if (a.septima === '7') septima = (a.raiz + 10) % 12;
  else if (funcion === 'D' || a.menor) septima = (a.raiz + 10) % 12; // la 7.ª que «pega» aunque no se toque
  const guia = [tercera, septima].filter((x): x is number => x !== null);
  return { raiz: a.raiz, tercera, quinta, septima, guia };
}

// ── Análisis completo de una canción ───────────────────────────────────────────────────────────

export interface ResumenAcorde {
  acorde: string;
  grado: string;
  funcion: Funcion;
  secundario?: string;
  /** Segundos totales que suena en la canción y cuántas veces entra. */
  segundos: number;
  veces: number;
}

export interface AnalisisArmonico {
  tonalidad: Tonalidad;
  /** true si la tonalidad se dedujo de los acordes (no venía de la ficha). */
  tonalidadEstimada: boolean;
  modo: Modo;
  /** Análisis de cada tramo de entrada, en orden (los «N» salen como null). */
  porTramo: Array<AcordeAnalizado | null>;
  acordes: ResumenAcorde[];
  /** Fracción (0-1) del tiempo que pasa en cada función. */
  funciones: Record<Funcion, number>;
  bucle: Bucle | null;
  /** Cambios de acorde por minuto (ritmo armónico). */
  cambiosPorMinuto: number;
}

const FUNCIONES_VACIAS = (): Record<Funcion, number> => ({ T: 0, S: 0, D: 0, M: 0, X: 0 });

/**
 * Analiza una canción a partir de sus tramos de acordes. `tonalidadFicha` (la de la ficha de la
 * canción) manda si es válida; si no, se deduce de los acordes.
 */
export function analizarArmonia(tramos: TramoAcorde[], tonalidadFicha?: string | null): AnalisisArmonico | null {
  const validos = tramos.filter((s) => s.acorde !== 'N' && parseAcorde(s.acorde));
  if (validos.length < 2) return null;
  const deFicha = parseTonalidad(tonalidadFicha);
  const estimada = estimarTonalidad(tramos);
  const tonalidad = deFicha ?? estimada;
  if (!tonalidad) return null;
  const modo = estimarModo(tramos, tonalidad);

  // Siguiente acorde REAL distinto, para reconocer dominantes secundarios.
  const porTramo: Array<AcordeAnalizado | null> = tramos.map((s, i) => {
    if (s.acorde === 'N' || !parseAcorde(s.acorde)) return null;
    let sig: string | null = null;
    for (let j = i + 1; j < tramos.length; j++) {
      if (tramos[j].acorde !== 'N' && tramos[j].acorde !== s.acorde) { sig = tramos[j].acorde; break; }
    }
    return analizarAcorde(s.acorde, tonalidad, sig);
  });

  const mapa = new Map<string, ResumenAcorde>();
  const funciones = FUNCIONES_VACIAS();
  let total = 0;
  let previo = '';
  tramos.forEach((s, i) => {
    const an = porTramo[i];
    if (!an) return;
    const dur = Math.max(0, s.t1 - s.t0);
    total += dur;
    funciones[an.funcion] += dur;
    const r = mapa.get(s.acorde) ?? { acorde: s.acorde, grado: an.grado, funcion: an.funcion, ...(an.secundario ? { secundario: an.secundario } : {}), segundos: 0, veces: 0 };
    r.segundos += dur;
    if (s.acorde !== previo) r.veces += 1;
    mapa.set(s.acorde, r);
    previo = s.acorde;
  });
  for (const f of Object.keys(funciones) as Funcion[]) funciones[f] = total > 0 ? Math.round((funciones[f] / total) * 1000) / 1000 : 0;

  const grados = porTramo.filter((x): x is AcordeAnalizado => x !== null).map((x) => x.grado);
  const duracion = Math.max(0.001, validos[validos.length - 1].t1 - validos[0].t0);
  let cambios = 0;
  validos.forEach((s, i) => { if (i > 0 && s.acorde !== validos[i - 1].acorde) cambios++; });
  return {
    tonalidad,
    tonalidadEstimada: !deFicha,
    modo,
    porTramo,
    acordes: [...mapa.values()].sort((a, b) => b.segundos - a.segundos),
    funciones,
    bucle: encontrarBucle(grados),
    cambiosPorMinuto: Math.round((cambios / duracion) * 60 * 10) / 10,
  };
}
