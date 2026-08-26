/**
 * Perfil de banda para los prompts de IA.
 *
 * Antes, las rutas de Reels escribían "Bakandeya" a pelo en el prompt, junto con su
 * instrumentación concreta y su regla de "no tiene vientos". En una app multi-banda eso
 * significaba que a CUALQUIER banda la IA le generaba copies hablando del violín y la
 * percusión reciclada de otra banda. Aquí se arma el bloque de contexto a partir de los
 * datos reales de la banda activa (registro, EPK, miembros y ADN de tono ya analizado).
 *
 * La parte de construcción del prompt es pura y está testeada; la de carga toca la BD.
 */

export interface BandMemberInfo {
  name: string;
  instrument: string;
}

export interface BandProfile {
  bandId: string;
  /** Nombre visible de la banda. Nunca vacío: cae a "la banda" si no hay dato. */
  name: string;
  genre: string;
  location: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  bio: string;
  members: BandMemberInfo[];
  /** Instrumentos reales deducidos de los miembros, deduplicados. */
  instruments: string[];
  toneSummary: string;
  toneTreatment: string;
  toneEnergy: string;
  toneVocabulary: string[];
  toneEmojis: string[];
  tonePhrases: string[];
}

export function emptyBandProfile(bandId = ""): BandProfile {
  return {
    bandId,
    name: "",
    genre: "",
    location: "",
    instagram: "",
    tiktok: "",
    youtube: "",
    bio: "",
    members: [],
    instruments: [],
    toneSummary: "",
    toneTreatment: "",
    toneEnergy: "",
    toneVocabulary: [],
    toneEmojis: [],
    tonePhrases: []
  };
}

/** Nombre para mostrar, con un respaldo neutro para no dejar huecos en el prompt. */
export function displayBandName(profile?: Partial<BandProfile> | null): string {
  const n = (profile?.name || "").trim();
  return n || "la banda";
}

function limpiar(v: any): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function listaLimpia(v: any, max = 12): string[] {
  if (!Array.isArray(v)) return [];
  const salida: string[] = [];
  for (const item of v) {
    const s = limpiar(item);
    if (s && !salida.includes(s)) salida.push(s);
    if (salida.length >= max) break;
  }
  return salida;
}

/**
 * Un miembro puede declarar varios instrumentos en un campo libre
 * ("Cantante, Loops y Percusión"), así que se parten por comas y por " y ".
 */
export function parseInstruments(members: BandMemberInfo[]): string[] {
  // Roles de gestión y etiquetas tipo "Líder de Ruta 66" no son instrumentos: si se colaran
  // en la ficha, la IA acabaría escribiendo "solo de mánager".
  const fuera = /^(m[áa]nager|booking|oficina|admin|administraci[óo]n|l[íi]der(\s+de\s+.*)?|showman|showwoman|road\s*manager|t[ée]cnic[oa]( de sonido)?)$/i;
  const salida: string[] = [];
  for (const m of members) {
    const bruto = limpiar(m.instrument);
    if (!bruto) continue;
    const piezas = bruto
      .split(/[,/]|\s+y\s+/i)
      .map((p) => limpiar(p))
      .filter(Boolean);
    for (const pieza of piezas) {
      if (fuera.test(pieza)) continue;
      const yaEsta = salida.some((s) => s.toLowerCase() === pieza.toLowerCase());
      if (!yaEsta) salida.push(pieza);
    }
  }
  return salida;
}

/** Hashtags de partida derivados del nombre y el estilo, sin inventar nada. */
export function baseHashtags(profile: Partial<BandProfile> | null | undefined, max = 5): string[] {
  const tags: string[] = [];
  const push = (raw: string) => {
    const limpio = limpiar(raw)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join("");
    if (!limpio) return;
    const tag = `#${limpio}`;
    if (!tags.some((t) => t.toLowerCase() === tag.toLowerCase())) tags.push(tag);
  };

  push(profile?.name || "");
  for (const g of limpiar(profile?.genre).split(/[,/]|\s+y\s+/i)) push(g);
  push(profile?.location || "");
  push("MusicaEnDirecto");

  return tags.slice(0, max);
}

/**
 * Bloque de texto con TODO lo que la IA sabe de verdad sobre la banda, más las reglas
 * anti-invención. Es lo que sustituye al párrafo hardcodeado de Bakandeya.
 */
export function buildBandContextBlock(profile: Partial<BandProfile> | null | undefined): string {
  const p = { ...emptyBandProfile(), ...(profile || {}) };
  const nombre = displayBandName(p);
  const lineas: string[] = [];

  lineas.push(`FICHA REAL DE LA BANDA (usa SOLO estos datos, no inventes otros):`);
  lineas.push(`- Nombre: "${nombre}"`);
  if (p.genre) lineas.push(`- Estilo musical: ${p.genre}`);
  if (p.location) lineas.push(`- Localización / escena: ${p.location}`);
  if (p.instruments.length) {
    lineas.push(`- Instrumentación REAL de la formación: ${p.instruments.join(", ")}`);
  }
  if (p.members.length) {
    const conNombre = p.members
      .filter((m) => limpiar(m.name) && limpiar(m.instrument))
      .map((m) => `${m.name} (${m.instrument})`);
    if (conNombre.length) lineas.push(`- Miembros: ${conNombre.join("; ")}`);
  }
  if (p.bio) lineas.push(`- Biografía/EPK: "${p.bio.substring(0, 600)}"`);
  if (p.instagram) lineas.push(`- Instagram: ${p.instagram}`);
  if (p.tiktok) lineas.push(`- TikTok: ${p.tiktok}`);
  if (p.youtube) lineas.push(`- YouTube: ${p.youtube}`);

  if (p.toneSummary || p.toneVocabulary.length || p.tonePhrases.length || p.toneEmojis.length) {
    lineas.push("");
    lineas.push("ADN DE VOZ YA ANALIZADO DE ESTA BANDA (imítalo, es como hablan de verdad):");
    if (p.toneSummary) lineas.push(`- Tono: ${p.toneSummary}`);
    if (p.toneTreatment) lineas.push(`- Tratamiento habitual: ${p.toneTreatment}`);
    if (p.toneEnergy) lineas.push(`- Nivel de energía: ${p.toneEnergy}`);
    if (p.toneVocabulary.length) lineas.push(`- Vocabulario propio: ${p.toneVocabulary.join(", ")}`);
    if (p.tonePhrases.length) lineas.push(`- Expresiones reales suyas: ${p.tonePhrases.map((f) => `"${f}"`).join(" | ")}`);
    if (p.toneEmojis.length) lineas.push(`- Emojis que usan: ${p.toneEmojis.join(" ")}`);
    lineas.push("");
    lineas.push("ESTE ADN DE VOZ MANDA SOBRE CUALQUIER REGLA GENÉRICA DE REDACCIÓN QUE VENGA DESPUÉS:");
    if (p.toneVocabulary.length) {
      lineas.push(`- Usa de verdad varias de esas palabras (${p.toneVocabulary.slice(0, 4).join(", ")}...) en el copy y el hookText, no las dejes solo como referencia.`);
    }
    if (p.tonePhrases.length) {
      lineas.push(`- Si alguna expresión real suya encaja de forma natural, cuélala tal cual, entre comillas si hace falta.`);
    }
    if (p.toneEmojis.length) {
      lineas.push(`- Usa emojis DE ESA LISTA (${p.toneEmojis.join(" ")}) en vez de otros genéricos, y en la cantidad que ellos usarían de verdad, aunque eso choque con un tope genérico de emojis.`);
    }
    lineas.push(`- El tono y el nivel de energía de arriba pesan más que cualquier plantilla de estilo genérica: que se note en cómo suena el texto, no en una redacción neutra e intercambiable con la de otra banda.`);
  }

  lineas.push("");
  lineas.push("REGLAS DURAS ANTI-INVENCIÓN:");
  if (p.instruments.length) {
    lineas.push(
      `1. La formación de "${nombre}" es exactamente: ${p.instruments.join(", ")}. NO menciones jamás ningún instrumento que no esté en esa lista (nada de vientos, trompetas, saxos, coros o teclados si no aparecen ahí).`
    );
  } else {
    lineas.push(
      `1. No se conoce la instrumentación de "${nombre}": NO nombres instrumentos concretos, habla de la banda y del momento en términos generales.`
    );
  }
  lineas.push(
    `2. No afirmes qué instrumento suena en un tramo concreto salvo que la transcripción o las notas del usuario lo dejen claro. Ante la duda, usa títulos estructurales ("Arranque y hook inicial", "Sección rítmica en directo", "Cierre y clímax").`
  );
  lineas.push(
    `3. No inventes fechas, ciudades, giras, cifras de público ni nombres de canciones que no aparezcan en los datos anteriores.`
  );
  lineas.push(`4. Escribe siempre en español de España, cercano y natural, sin sonar a folleto publicitario.`);

  return lineas.join("\n");
}

/**
 * Carga el perfil real de la banda activa. Nunca lanza: si la BD falla, devuelve lo que
 * haya podido reunir, porque un fallo de contexto no debe tumbar la generación de Reels.
 */
export async function loadBandProfile(
  bandId: string,
  deps: {
    getBand: (id: string) => Promise<any>;
    getEpk: (id: string) => Promise<any>;
    getState: () => any;
  }
): Promise<BandProfile> {
  const perfil = emptyBandProfile(bandId);

  const [band, epk] = await Promise.all([
    deps.getBand(bandId).catch(() => null),
    deps.getEpk(bandId).catch(() => null)
  ]);

  perfil.name = limpiar(band?.nombre_banda || band?.nombreBanda || band?.bandName);
  perfil.genre = limpiar(band?.estilo_musical || band?.estiloMusical);
  perfil.location = limpiar(band?.localizacion);
  perfil.instagram = limpiar(epk?.enlacesRedes?.instagram || band?.instagram);
  perfil.tiktok = limpiar(epk?.enlacesRedes?.tiktok || band?.tiktok);
  perfil.youtube = limpiar(epk?.enlacesRedes?.youtube || band?.spotify_youtube);
  perfil.bio = limpiar(epk?.biografia);

  // ADN de voz guardado en Supabase por /api/bands/analyze-tone (fuente durable: sobrevive a
  // un redeploy). Se lee antes que el estado local para que el análisis que ve el usuario y
  // el que usa la IA para escribir sean siempre el mismo.
  const adnDurable = band?.dna_expresion;
  if (adnDurable && typeof adnDurable === "object") {
    perfil.toneSummary = limpiar(adnDurable.tono_comunicacion);
    perfil.toneTreatment = limpiar(adnDurable.tratamiento_habitual);
    perfil.toneEnergy = limpiar(adnDurable.nivel_energia);
    perfil.toneVocabulary = listaLimpia(adnDurable.vocabulario_clave, 10);
    perfil.toneEmojis = listaLimpia(adnDurable.emojis_frecuentes, 8);
    perfil.tonePhrases = listaLimpia(adnDurable.frases_emblematicas_extraidas, 4);
  }

  let state: any = null;
  try {
    state = deps.getState();
  } catch (e) {
    state = null;
  }

  if (state) {
    const idLimpio = (bandId || "").replace(/^(band|reg)-/, "").toLowerCase();
    const mismoId = (v: any) =>
      limpiar(v).toLowerCase() === (bandId || "").toLowerCase() ||
      limpiar(v).replace(/^(band|reg)-/, "").toLowerCase() === idLimpio;

    const usuarios = Array.isArray(state.users) ? state.users : [];
    perfil.members = usuarios
      .filter((u: any) => mismoId(u.band_id))
      .map((u: any) => ({ name: limpiar(u.name || u.username), instrument: limpiar(u.instrument) }))
      .filter((m: BandMemberInfo) => m.name || m.instrument);

    if (!perfil.name) {
      const desdeUsuario = usuarios.find((u: any) => mismoId(u.band_id) && limpiar(u.bandName || u.band_name));
      perfil.name = limpiar(desdeUsuario?.bandName || desdeUsuario?.band_name);
    }

    // Respaldo del ADN de voz en el caché local (data.json), solo si Supabase no lo tenía
    // todavía: cubre despliegues sin Supabase configurado o análisis guardados antes de que
    // existiera esta columna.
    const bandas = Array.isArray(state.bands) ? state.bands : [];
    const conAdn = bandas.find((b: any) => (mismoId(b.band_id) || mismoId(b.id)) && b.dna_expresion);
    const adn = conAdn?.dna_expresion;
    if (adn && !perfil.toneSummary) {
      perfil.toneSummary = limpiar(adn.tono_comunicacion);
      perfil.toneTreatment = limpiar(adn.tratamiento_habitual);
      perfil.toneEnergy = limpiar(adn.nivel_energia);
      perfil.toneVocabulary = listaLimpia(adn.vocabulario_clave, 10);
      perfil.toneEmojis = listaLimpia(adn.emojis_frecuentes, 8);
      perfil.tonePhrases = listaLimpia(adn.frases_emblematicas_extraidas, 4);
    }
  }

  perfil.instruments = parseInstruments(perfil.members);
  return perfil;
}
