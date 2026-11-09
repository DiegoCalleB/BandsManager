/**
 * Plantilla de email para una campaña de festivales: un texto con huecos ({festival}, {ciudad}, {linea_publico},
 * {frase_edicion}, {banda}, {estilo_banda}) que se rellena con datos REALES de cada festival (su nombre, su ciudad, sus estilos y la
 * fecha de su edición, si se conoce) y en el idioma que toca. No inventa nada: lo que no se sabe, no se dice.
 * El asunto va en la primera línea («Asunto: …») y el servidor lo separa al enviar (`server/utils/asuntoDelPitch.ts`).
 * La firma con el dossier la añade la app sola al enviar, por eso la plantilla no lleva firma ni enlaces.
 */

export interface LeadParaPlantilla {
  id?: string | null;
  nombre_sala?: string | null;
  /** Provincia, país («Emilia-Romaña (Italia)») o código ISO («UK»). */
  region?: string | null;
  ciudad?: string | null;
  genero?: string | null;
  website?: string | null;
  festival_start_date?: string | null;
  festival_end_date?: string | null;
}

export type Idioma = 'es' | 'en';

export interface DatosPlantilla {
  festival: string;
  ciudad: string;
  /** Estilos del festival ya redactados («el rock», «el ska»…), en el idioma de la plantilla. */
  estilos: string[];
  idioma: Idioma;
  lineaPublico: string;
  fraseEdicion: string;
}

export const PLANTILLA_FESTIVAL_ES = `Asunto: Black Friday: {banda} al caché de 2026 para {festival}

Buenas gente de {festival},

{linea_publico} Os escribimos porque estamos cuadrando la ruta de la próxima edición.{frase_edicion}

{banda} es {estilo_banda} {remate}. Es Black Friday: durante estos días mantenemos nuestro caché actual de 2026 y, con el disco de 2027, subirá.

Podéis ver la respuesta del público en el vídeo del dossier web al pie de la firma, donde tenéis también toda la información.

Si aún no tenéis cerrado el cartel, sería un auténtico placer poder formar parte de él. ¡Seguro que lo estáis montando de lujo!

¡Un abrazo!`;

export const PLANTILLA_FESTIVAL_EN = `Asunto: Black Friday: {banda} at our 2026 fee for {festival}

Hi {festival} team,

{linea_publico} We're lining up next edition's route.{frase_edicion}

{banda} brings {estilo_banda}, {remate}. It's Black Friday: for these few days we're keeping our current 2026 fee, and it goes up with the 2027 album.

You can see how the crowd reacts in the video of the dossier at the bottom of the signature, where you'll also find all the info.

If your line-up isn't closed yet, it would be a real pleasure to be part of it. We're sure you're putting together something great!

Cheers!`;

export type FamiliaFestival = 'electro' | 'reggae' | 'cana' | 'raices' | 'defecto';

/** Cómo se presenta la banda a una familia de festivales: su estilo y la frase que lo remata, en cada idioma. */
export interface EstiloDeBanda {
  es: string;
  en: string;
  remate_es: string;
  remate_en: string;
}
export type EstilosPorFamilia = Partial<Record<FamiliaFestival, EstiloDeBanda>>;

const REMATE_ES = 'pensado para poner el recinto a saltar desde el primer minuto';
const REMATE_EN = 'built to get the whole site jumping from the first minute';

const sinTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const PAISES = new Set([
  'alemania', 'francia', 'italia', 'portugal', 'paises bajos', 'belgica', 'suiza', 'austria', 'polonia', 'reino unido', 'irlanda',
  'dinamarca', 'suecia', 'noruega', 'finlandia', 'islandia', 'chequia', 'republica checa', 'eslovaquia', 'hungria', 'croacia', 'serbia',
  'eslovenia', 'rumania', 'rumanía', 'bulgaria', 'grecia', 'letonia', 'lituania', 'estonia', 'montenegro', 'bosnia y herzegovina',
  'macedonia del norte', 'albania', 'luxemburgo', 'malta', 'ucrania', 'turquia',
]);
const TLD_EXTRANJEROS = new Set(['de', 'fr', 'it', 'nl', 'be', 'ch', 'pl', 'dk', 'se', 'no', 'fi', 'pt', 'uk', 'ie', 'cz', 'sk', 'hu', 'at', 'hr', 'si', 'rs', 'ro', 'gr', 'lv', 'lt', 'ee', 'is', 'lu', 'bg', 'mt', 'ba', 'mk', 'me', 'al', 'ua', 'tr']);

/** [patrón, español, inglés, ¿es un estilo festivo y bailable?] */
const ESTILOS: Array<[RegExp, string, string, boolean]> = [
  [/electr/, 'la electrónica', 'electronic music', false],
  [/punk/, 'el punk', 'punk', true],
  [/rock/, 'el rock', 'rock', true],
  [/\bska\b/, 'el ska', 'ska', true],
  [/reggae|\bdub\b/, 'el reggae', 'reggae', true],
  [/mestiz|fusion/, 'el mestizaje', 'fusion', true],
  [/balkan|balcan/, 'el balkan', 'balkan music', true],
  [/hip|\brap\b/, 'el rap', 'hip-hop', true],
  [/folk/, 'el folk', 'folk', false],
  [/indie/, 'el indie', 'indie', false],
  [/\bpop\b/, 'el pop', 'pop', false],
  [/mundo|world/, 'la música del mundo', 'world music', false],
  [/artes de calle/, 'las artes de calle', 'street arts', false],
  [/callejera|busk/, 'la música de calle', 'street music', false],
];

/** Familia de un festival según su género: manda el primer género de la lista que encaje (indie y pop no deciden). */
const FAMILIAS: Array<[RegExp, FamiliaFestival]> = [
  [/electr/, 'electro'],
  [/reggae|\bdub\b/, 'reggae'],
  [/punk|rock|\bska\b|mestiz|fusion|hip|\brap\b/, 'cana'],
  [/balkan|balcan|folk|mundo|world|artes de calle|callejera|busk/, 'raices'],
];

export function familiaDeFestival(genero?: string | null): FamiliaFestival {
  for (const token of sinTildes(genero ?? '').split(/[,/·|]/).map((t) => t.trim()).filter(Boolean)) {
    const hallada = FAMILIAS.find(([re]) => re.test(token));
    if (hallada) return hallada[1];
  }
  return 'defecto';
}

const MESES_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MESES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function limpiarNombre(nombre: string): string {
  return nombre
    .replace(/\([^)]*\)/g, ' ')
    .split(/\s[—–-]\s/)[0]
    .replace(/\s+20\d\d\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function enLista(items: string[], y: string): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} ${y} ${items[items.length - 1]}`;
}

function idiomaDe(lead: LeadParaPlantilla, ciudadBruta: string): Idioma {
  const region = (lead.region ?? '').trim();
  if (/^[A-Z]{2}$/.test(region)) return region === 'ES' ? 'es' : 'en';
  const paises = [ciudadBruta.match(/\(([^)]+)\)\s*$/)?.[1], region.match(/\(([^)]+)\)\s*$/)?.[1], ciudadBruta, region].map((p) => sinTildes(p ?? ''));
  if (paises.some((p) => p === 'espana')) return 'es';
  if (paises.some((p) => PAISES.has(p))) return 'en';
  if ((lead.id ?? '').startsWith('lead-fest-eu-')) return 'en';
  const tld = (() => {
    try {
      return new URL(lead.website ?? '').hostname.split('.').pop() ?? '';
    } catch {
      return '';
    }
  })();
  return TLD_EXTRANJEROS.has(tld) ? 'en' : 'es';
}

function partes(fecha?: string | null) {
  const m = (fecha ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? { a: Number(m[1]), m: Number(m[2]) - 1, d: Number(m[3]) } : null;
}

function rangoDeFechas(ini: NonNullable<ReturnType<typeof partes>>, fin: ReturnType<typeof partes>, idioma: Idioma): string {
  const f = fin && (fin.a !== ini.a || fin.m !== ini.m || fin.d !== ini.d) ? fin : null;
  if (idioma === 'en') {
    if (!f) return `${ini.d} ${MESES_EN[ini.m]} ${ini.a}`;
    return f.m === ini.m ? `${ini.d}–${f.d} ${MESES_EN[ini.m]} ${ini.a}` : `${ini.d} ${MESES_EN[ini.m]} – ${f.d} ${MESES_EN[f.m]} ${ini.a}`;
  }
  if (!f) return `el ${ini.d} de ${MESES_ES[ini.m]} de ${ini.a}`;
  return f.m === ini.m ? `del ${ini.d} al ${f.d} de ${MESES_ES[ini.m]} de ${ini.a}` : `del ${ini.d} de ${MESES_ES[ini.m]} al ${f.d} de ${MESES_ES[f.m]} de ${ini.a}`;
}

function tercio(dia: number, idioma: Idioma): string {
  const t = dia <= 10 ? 0 : dia <= 20 ? 1 : 2;
  return idioma === 'es' ? ['a principios de', 'a mediados de', 'a finales de'][t] : ['in early', 'in mid-', 'in late'][t];
}

function fraseEdicion(ciudad: string, ini: ReturnType<typeof partes>, fin: ReturnType<typeof partes>, idioma: Idioma, hoy: string): string {
  const vigente = ini && (fin ?? ini) && `${(fin ?? ini).a}-${String((fin ?? ini).m + 1).padStart(2, '0')}-${String((fin ?? ini).d).padStart(2, '0')}` >= hoy;
  if (idioma === 'en') {
    if (ini && vigente) return ` We saw your next edition is ${rangoDeFechas(ini, fin, 'en')}${ciudad ? ` in ${ciudad}` : ''}, and it would suit us perfectly.`;
    if (ini) return ` We saw the last edition took place ${tercio(ini.d, 'en')}${tercio(ini.d, 'en').endsWith('-') ? '' : ' '}${MESES_EN[ini.m]}${ciudad ? ` in ${ciudad}` : ''}, and we'd love to be part of the next one.`;
    return ciudad ? ` We'd love to come play in ${ciudad}.` : '';
  }
  if (ini && vigente) return ` Hemos visto que la próxima edición${ciudad ? ` en ${ciudad}` : ''} es ${rangoDeFechas(ini, fin, 'es')}, y nos encajaría de lujo.`;
  if (ini) return ` Vimos que la última edición fue ${tercio(ini.d, 'es')} ${MESES_ES[ini.m]} y nos apetece mucho pasar por ${ciudad || 'vuestro festival'} en la próxima.`;
  return ciudad ? ` Nos apetece mucho pasar por ${ciudad}.` : '';
}

export function datosDePlantilla(lead: LeadParaPlantilla, ahora: Date = new Date()): DatosPlantilla {
  const ciudadBruta = (lead.ciudad ?? '').trim();
  const idioma = idiomaDe(lead, ciudadBruta);
  const festival = limpiarNombre(lead.nombre_sala ?? '') || (idioma === 'es' ? 'vuestro festival' : 'your festival');
  const ciudad = ciudadBruta.replace(/\s*\([^)]*\)\s*$/, '').trim();

  const tokens = sinTildes(lead.genero ?? '').split(/[,/·|]/).map((t) => t.trim()).filter(Boolean);
  const vistos = new Set<string>();
  const encontrados: Array<{ es: string; en: string; festivo: boolean }> = [];
  for (const t of tokens) {
    const e = ESTILOS.find(([re]) => re.test(t));
    if (e && !vistos.has(e[1])) {
      vistos.add(e[1]);
      encontrados.push({ es: e[1], en: e[2], festivo: e[3] });
    }
  }
  const usados = encontrados.slice(0, 4);
  const estilos = usados.map((u) => (idioma === 'es' ? u.es : u.en));

  let lineaPublico: string;
  if (idioma === 'es') {
    if (usados.some((u) => u.festivo)) lineaPublico = `Conocemos de sobra el pulso y la caña que pide vuestro público entre ${enLista(estilos, 'y')}.`;
    else if (estilos.length) lineaPublico = `Nos encanta el ambiente que se vive en ${festival}, con ${enLista(estilos, 'y')}.`;
    else lineaPublico = `Nos encanta el ambiente que tiene ${festival}.`;
  } else if (estilos.length) lineaPublico = `We love the atmosphere at ${festival}, with ${enLista(estilos, 'and')}.`;
  else lineaPublico = `We love the atmosphere at ${festival}.`;

  const hoy = ahora.toISOString().slice(0, 10);
  const ini = partes(lead.festival_start_date);
  const fin = partes(lead.festival_end_date) ?? ini;
  return { festival, ciudad, estilos, idioma, lineaPublico, fraseEdicion: fraseEdicion(ciudad, ini, fin, idioma, hoy) };
}

/** Sustituye cada {hueco} por su valor. Un hueco desconocido se queda tal cual (así se nota). */
export function rellenarPlantilla(plantilla: string, valores: Record<string, string>): string {
  return plantilla.replace(/\{([a-z_]+)\}/g, (hueco, clave: string) => valores[clave] ?? hueco);
}

export interface OpcionesPitchFestival {
  banda: string;
  /** Cómo se define la banda («electrónica y ska»); sale del género de su EPK. */
  estiloBanda?: string;
  ahora?: Date;
  /** Cómo se presenta la banda a cada familia de festivales (guardado en la campaña); sin él, se usa `estiloBanda`. */
  estilosBanda?: EstilosPorFamilia;
  /** Plantillas guardadas en la campaña; si faltan, se usan las de por defecto. */
  plantillas?: { es?: string | null; en?: string | null };
}

/** El estilo de la banda (texto libre del EPK) en el idioma del email: los géneros que reconoce, o «live music». */
function estiloDeLaBanda(texto: string | undefined, idioma: Idioma): string {
  const t = sinTildes(texto ?? '');
  const hallados = ESTILOS.map(([re, es, en]) => ({ pos: t.search(re), es, en })).filter((e) => e.pos >= 0).sort((a, b) => a.pos - b.pos);
  if (idioma === 'en') return hallados.length ? enLista(hallados.slice(0, 4).map((e) => e.en), 'and') : 'live music';
  return (texto ?? '').trim() || 'directo festivo';
}

export function redactarPitchFestival(lead: LeadParaPlantilla, { banda, estiloBanda, estilosBanda, ahora = new Date(), plantillas }: OpcionesPitchFestival): string {
  const d = datosDePlantilla(lead, ahora);
  const presentacion = estilosBanda?.[familiaDeFestival(lead.genero)] ?? estilosBanda?.defecto;
  const plantilla = d.idioma === 'en' ? plantillas?.en || PLANTILLA_FESTIVAL_EN : plantillas?.es || PLANTILLA_FESTIVAL_ES;
  return rellenarPlantilla(plantilla, {
    banda,
    estilo_banda: presentacion ? (d.idioma === 'en' ? presentacion.en : presentacion.es) : estiloDeLaBanda(estiloBanda, d.idioma),
    remate: presentacion ? (d.idioma === 'en' ? presentacion.remate_en : presentacion.remate_es) : d.idioma === 'en' ? REMATE_EN : REMATE_ES,
    festival: d.festival,
    ciudad: d.ciudad,
    linea_publico: d.lineaPublico,
    frase_edicion: d.fraseEdicion,
  });
}
