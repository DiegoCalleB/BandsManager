/**
 * Especialista en anuncios: qué piezas ya publicadas merece la pena impulsar con dinero y cuáles NO.
 * Lógica pura y determinista, con lo que la banda ya midió. La regla de fondo, la que evita tirar el
 * dinero: un anuncio solo amplifica. Si a los vuestros les encanta pero no sale de casa
 * (`falla_descubrimiento`), pagar alcance es justo lo que le falta; si ya funciona, un empujón la
 * multiplica; si llega lejos pero no se guarda, o no llega ni se guarda, pagar solo trae más gente que
 * pasa de largo y primero hay que arreglar la pieza.
 *
 * El diagnóstico sale del temario (`diagnosticoMetricas.ts`); los importes, la zona y la duración son
 * criterio propio de un presupuesto pequeño y se dicen así. Para TikTok y YouTube, que no tienen
 * umbrales, se usa la lectura relativa a la propia banda.
 */
import { diasEntre } from '../campanaConcierto';
import { lecturaRelativa, previasDe, type ResultadoRed } from './metricasPorRed';
import type { Formato, Red } from './reglasFormato';
import { lecturaDe, type ResultadoPieza } from './resumen';

export type Decision = 'impulsar' | 'no_gastar' | 'esperar';

export interface PlanAnuncio {
  objetivo: 'entradas' | 'alcance';
  /** Lo que se elige en el botón «Promocionar», en palabras de la banda. */
  objetivoTexto: string;
  zona: string;
  presupuestoDia: number;
  dias: number;
  total: number;
  publico: string;
  pasos: string[];
}

export interface CandidatoAnuncio {
  fecha: string;
  tarjetaId: string;
  titulo: string;
  formato: Formato;
  red: Red;
  decision: Decision;
  /** Por qué, en una frase. */
  motivo: string;
  /** Solo si se recomienda impulsar. */
  plan: PlanAnuncio | null;
}

export interface DatosAnuncios {
  hoy: string;
  /** Resultados de Instagram. */
  resultados: ResultadoPieza[];
  /** Resultados de TikTok y YouTube. */
  resultadosRed: ResultadoRed[];
  /** El próximo bolo público, si hay. */
  proximoBolo: { sala: string; ciudad: string; dias: number; tieneEntradas: boolean } | null;
  /** Ciudad de la banda. */
  ciudad: string;
  genero: string;
  /** Artistas parecidos (referentes de la estrategia y «para fans de» del dossier). */
  referentes: string[];
}

export const DIAS_VENTANA = 14;
export const MAX_CANDIDATOS = 4;
/** Presupuesto pequeño por defecto: lo mínimo para ver una señal, criterio propio. */
export const PRESUPUESTO_DIA = 5;
export const DIAS_ANUNCIO = 5;
const DIAS_MINIMOS = 2;
/** A partir de cuántos días un bolo ya manda sobre el objetivo del anuncio. */
const DIAS_BOLO_CERCANO = 21;

const primerValor = (t: string) => (t || '').split(/[,/;·|]/)[0].replace(/\s+/g, ' ').trim();

/** Orden de interés: lo que más ganaría con dinero primero. */
const PESO: Record<Decision, number> = { impulsar: 0, esperar: 1, no_gastar: 2 };

function publicoDe(d: DatosAnuncios): string {
  const genero = primerValor(d.genero).toLowerCase();
  const refs = d.referentes.slice(0, 3);
  const partes = [genero && `quienes escuchan ${genero}`, refs.length > 0 && `fans de ${refs.join(', ')}`].filter(Boolean);
  return partes.length ? `Gente de la zona: ${partes.join(' y ')}.` : 'Gente de la zona interesada en música en directo.';
}

/** Cómo se promociona en cada red; YouTube va por Google Ads y se deja para más adelante. */
const BOTON: Partial<Record<Red, string>> = {
  instagram: 'Abrid la publicación en vuestro perfil y pulsad «Promocionar».',
  tiktok: 'Abrid el vídeo en vuestro perfil y pulsad «Promocionar».',
};

function planDe(d: DatosAnuncios, red: Red): PlanAnuncio | null {
  const boton = BOTON[red];
  if (!boton) return null;
  const bolo = d.proximoBolo && d.proximoBolo.dias <= DIAS_BOLO_CERCANO && d.proximoBolo.tieneEntradas ? d.proximoBolo : null;
  const dias = bolo ? Math.max(DIAS_MINIMOS, Math.min(DIAS_ANUNCIO, bolo.dias - 1)) : DIAS_ANUNCIO;
  const ciudad = primerValor(bolo?.ciudad || d.ciudad);
  const objetivo = bolo ? 'entradas' : 'alcance';
  const objetivoTexto = bolo ? 'Visitas al enlace (que lleven a las entradas)' : 'Más cuentas alcanzadas (que os vea gente nueva)';
  const zona = ciudad ? `${ciudad} y unos ${bolo ? 30 : 50} km alrededor` : 'Vuestra ciudad y alrededores';
  const publico = publicoDe(d);
  return {
    objetivo, objetivoTexto, zona, presupuestoDia: PRESUPUESTO_DIA, dias, total: PRESUPUESTO_DIA * dias, publico,
    pasos: [
      boton,
      `Objetivo: ${objetivoTexto}.`,
      `Zona: ${zona}. ${publico}`,
      `Presupuesto: ${PRESUPUESTO_DIA} € al día durante ${dias} días (${PRESUPUESTO_DIA * dias} € en total).`,
      bolo ? 'Comprobad que el enlace de vuestra bio lleva a las entradas del bolo: un anuncio solo amplifica, y un clic que no llega a las entradas se pierde.' : 'Comprobad que la bio dice qué sois y dónde: quien llega por el anuncio mira el perfil antes de seguir.',
      'A las 48 h mirad los números y parad si no se mueven: no hace falta gastar el total.',
    ],
  };
}

interface Veredicto { decision: Decision; motivo: string; peso: number }

/** Instagram: el diagnóstico del temario decide si pagar tiene sentido. */
function decidirInstagram(r: ResultadoPieza): Veredicto {
  const { veredicto } = lecturaDe(r);
  switch (veredicto) {
    case 'falla_descubrimiento': return { decision: 'impulsar', peso: 0, motivo: 'A los vuestros les encanta (la guardan) pero no sale de vuestra gente: lo que le falta es alcance, y eso se puede pagar.' };
    case 'funciona': return { decision: 'impulsar', peso: 1, motivo: 'Ya funciona sola: llega a gente nueva y la guardan. Un empujón la multiplica.' };
    case 'falla_valor': return { decision: 'no_gastar', peso: 2, motivo: 'Llega lejos pero casi nadie la guarda: pagar solo traería más gente que pasa de largo. Mejorad el contenido primero.' };
    case 'falla_todo': return { decision: 'no_gastar', peso: 3, motivo: 'Ni llega ni se guarda: no la impulséis, probad otro tema o formato.' };
    default: return { decision: 'esperar', peso: 4, motivo: 'Todavía hay poco alcance para saber si merece la pena (hacen falta unas 100 cuentas y 48 h).' };
  }
}

/** TikTok: sin umbrales de temario, se compara con lo habitual de la propia banda. */
function decidirTikTok(r: ResultadoRed, todos: ResultadoRed[], hoy: string): Veredicto {
  const lectura = lecturaRelativa(r.red as 'tiktok' | 'youtube', r.metricas, previasDe(todos, r, hoy));
  switch (lectura.estado) {
    case 'por_encima': return { decision: 'impulsar', peso: 1, motivo: `Ha llegado más lejos que lo habitual en vuestra cuenta (${lectura.veces?.toFixed(1).replace('.', ',')}× la mediana): un empujón la multiplica.` };
    case 'por_debajo': return { decision: 'no_gastar', peso: 3, motivo: 'Ha llegado menos de lo habitual: no la impulséis, mirad los 3 primeros segundos.' };
    case 'en_su_linea': return { decision: 'esperar', peso: 4, motivo: 'Va como siempre: no hay motivo para pagar por ella. Impulsad solo lo que destaca.' };
    default: return { decision: 'esperar', peso: 4, motivo: 'Aún no hay con qué compararla para saber si merece la pena.' };
  }
}

/** Piezas de los últimos 14 días con su decisión, las que merecen dinero primero. */
export function candidatosAnuncio(d: DatosAnuncios): CandidatoAnuncio[] {
  const reciente = (fecha: string) => { const x = diasEntre(fecha, d.hoy); return x >= 0 && x <= DIAS_VENTANA; };
  // Las stories desaparecen a las 24 h: no hay nada que impulsar.
  const ig = d.resultados.filter((r) => reciente(r.fecha) && r.formato !== 'stories').map((r) => ({ r, v: decidirInstagram(r), red: 'instagram' as Red }));
  const otras = d.resultadosRed.filter((r) => reciente(r.fecha)).map((r) => ({ r, v: decidirTikTok(r, d.resultadosRed, d.hoy), red: r.red as Red }));

  return [...ig, ...otras]
    .sort((a, b) => PESO[a.v.decision] - PESO[b.v.decision] || a.v.peso - b.v.peso || (a.r.fecha < b.r.fecha ? 1 : -1))
    .slice(0, MAX_CANDIDATOS)
    .map(({ r, v, red }) => {
      // YouTube no tiene botón «Promocionar»: se anuncia con Google Ads. Se dice y no se inventa un plan.
      const plan = v.decision === 'impulsar' ? planDe(d, red) : null;
      const motivo = v.decision === 'impulsar' && !plan ? `${v.motivo} En YouTube se promociona desde Google Ads: empezad por Instagram o TikTok.` : v.motivo;
      return { fecha: r.fecha, tarjetaId: r.tarjetaId, titulo: r.titulo, formato: r.formato, red, decision: v.decision, motivo, plan };
    });
}
