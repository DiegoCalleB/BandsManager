/**
 * Kit de SEO de la banda: las frases con las que la buscan, y bios de cada red con su límite de
 * caracteres, hechas con sus datos reales (género, ciudad, próximo bolo). Lógica pura y
 * determinista, sin IA: cuesta cero, se puede probar y nunca inventa un dato.
 *
 * Criterio, no temario: el temario da la regla («género + ciudad, no el nombre de la banda»,
 * `REGLAS_TIKTOK`); las plantillas y los límites de cada red son criterio propio y se marcan así.
 */
import type { Red } from './reglasFormato';

/** Límites de caracteres de la bio de cada red (Instagram 150, TikTok 80, descripción del canal de YouTube 1000). */
export const LIMITE_BIO: Record<Red, number> = { instagram: 150, tiktok: 80, youtube: 1000 };
/** El campo «Nombre» de Instagram admite 64 caracteres y es el que cuenta en la búsqueda; el @ no. */
export const LIMITE_NOMBRE_INSTAGRAM = 64;

export interface DatosSeo {
  nombre: string;
  /** Género tal como lo escribió la banda («Rock / Blues», «indie pop»). */
  genero: string;
  /** Ciudad o zona («Madrid, España»). */
  ciudad: string;
  proximoBolo: { sala: string; /** AAAA-MM-DD */ fecha: string } | null;
  fraseImpacto?: string;
  /** Enlace con seguimiento de YouTube (para la descripción del canal), si ya existe. */
  enlaceYoutube?: string | null;
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** «2026-11-04» → «4 nov». */
export function diaMes(fecha: string): string {
  const [, m, d] = fecha.split('-').map(Number);
  return Number.isFinite(m) && Number.isFinite(d) && m >= 1 && m <= 12 ? `${d} ${MESES[m - 1]}` : fecha;
}

/** El primer valor de una lista escrita a mano: «Rock / Blues» → «Rock»; «Madrid, España» → «Madrid». */
export function primerValor(texto: string): string {
  return (texto || '').split(/[,/;·|]/)[0].replace(/\s+/g, ' ').trim();
}

const capitalizar = (t: string) => (t ? t[0].toUpperCase() + t.slice(1) : t);
const minusculas = (t: string) => t.toLocaleLowerCase('es');

/** Sin tildes ni mayúsculas, para comparar «Música» con «musica». */
export function normalizar(t: string): string {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/* ----------------------------------------------------------------- palabras clave */

export interface PalabraClave {
  frase: string;
  /** Qué busca quien teclea eso. */
  intencion: 'descubrir' | 'concierto' | 'local';
}

export const DONDE_USAR_PALABRAS = 'En el nombre del perfil, en la bio y en la primera línea de los textos de vuestras piezas.';

/** Las frases que escribe quien busca una banda como la vuestra. Sin género o ciudad salen las que se pueden sacar; sin ninguno, ninguna. */
export function palabrasClave(d: Pick<DatosSeo, 'genero' | 'ciudad' | 'proximoBolo'>): PalabraClave[] {
  const genero = minusculas(primerValor(d.genero));
  const ciudad = primerValor(d.ciudad);
  const frases: PalabraClave[] = [];
  if (genero && ciudad) {
    frases.push(
      { frase: `${genero} ${ciudad}`, intencion: 'descubrir' },
      { frase: `banda de ${genero} en ${ciudad}`, intencion: 'descubrir' },
      { frase: `bandas de ${genero} ${ciudad}`, intencion: 'descubrir' },
      { frase: `conciertos de ${genero} en ${ciudad}`, intencion: 'concierto' },
      { frase: `${genero} en directo ${ciudad}`, intencion: 'concierto' },
    );
  } else if (genero) {
    frases.push({ frase: `banda de ${genero}`, intencion: 'descubrir' }, { frase: `conciertos de ${genero}`, intencion: 'concierto' });
  }
  if (ciudad) frases.push({ frase: `música en directo en ${ciudad}`, intencion: 'local' });
  if (d.proximoBolo?.sala) frases.push({ frase: `conciertos ${d.proximoBolo.sala}${ciudad ? ` ${ciudad}` : ''}`, intencion: 'concierto' });
  return frases;
}

/** El nombre del perfil de Instagram: lleva género y ciudad porque ese campo sí se busca. */
export function nombreInstagram(d: Pick<DatosSeo, 'nombre' | 'genero' | 'ciudad'>): string {
  const genero = capitalizar(minusculas(primerValor(d.genero)));
  const ciudad = primerValor(d.ciudad);
  for (const cola of [[genero, ciudad], [genero]]) {
    const resto = cola.filter(Boolean).join(' ');
    const candidato = resto ? `${d.nombre} | ${resto}` : d.nombre;
    if (candidato.length <= LIMITE_NOMBRE_INSTAGRAM) return candidato;
  }
  return d.nombre.slice(0, LIMITE_NOMBRE_INSTAGRAM).trim();
}

/* ----------------------------------------------------------------- bios */

export interface OpcionBio {
  etiqueta: string;
  texto: string;
  caracteres: number;
  limite: number;
}

/** Une las líneas que caben; las opcionales se descartan de la última a la primera, la primera se recorta en una palabra entera. */
function ajustar(lineas: string[], limite: number, separador = '\n'): string {
  const util = lineas.filter(Boolean);
  while (util.length > 1 && util.join(separador).length > limite) util.pop();
  const texto = util.join(separador);
  if (texto.length <= limite) return texto;
  return texto.slice(0, limite + 1).replace(/\s+\S*$/, '').replace(/[\s,;:.-]+$/, '');
}

const opcion = (etiqueta: string, lineas: string[], limite: number, separador?: string): OpcionBio => {
  const texto = ajustar(lineas, limite, separador);
  return { etiqueta, texto, caracteres: texto.length, limite };
};

/** Bios de una red para elegir: directa, con el próximo bolo y con la frase de impacto, según los datos que haya. */
export function opcionesBio(red: Red, d: DatosSeo): OpcionBio[] {
  const genero = capitalizar(minusculas(primerValor(d.genero)));
  const ciudad = primerValor(d.ciudad);
  const limite = LIMITE_BIO[red];
  const quien = genero && ciudad ? `${genero} desde ${ciudad}` : genero || (ciudad ? `Música en directo desde ${ciudad}` : '');
  const bolo = d.proximoBolo ? `Próximo bolo: ${d.proximoBolo.sala}, ${diaMes(d.proximoBolo.fecha)}` : '';
  const frase = (d.fraseImpacto || '').replace(/\s+/g, ' ').trim();

  if (red === 'youtube') {
    const presentacion = `${d.nombre} es una banda${genero ? ` de ${minusculas(genero)}` : ''}${ciudad ? ` de ${ciudad}` : ''}.`;
    const enlace = d.enlaceYoutube ? `Fechas y entradas: ${d.enlaceYoutube}` : '';
    const contenido = 'Aquí subimos ensayos, directos y los vídeos cortos de cada bolo.';
    const opciones = [opcion('Directa', [presentacion, contenido, enlace], limite, '\n\n')];
    if (bolo) opciones.push(opcion('Con el próximo bolo', [presentacion, `${bolo}.`, contenido, enlace], limite, '\n\n'));
    if (frase) opciones.push(opcion('Con vuestra frase', [frase, presentacion, enlace], limite, '\n\n'));
    return opciones;
  }

  const cta = red === 'instagram' ? 'Próximos bolos y entradas en el enlace' : 'Bolos y entradas en el enlace';
  const opciones = quien ? [opcion('Directa', [quien, cta], limite)] : [];
  if (quien && bolo) opciones.push(opcion('Con el próximo bolo', [quien, bolo, 'Entradas en el enlace'], limite));
  if (frase) opciones.push(opcion('Con vuestra frase', [frase, [genero, ciudad].filter(Boolean).join(' · '), cta], limite));
  return opciones;
}
