// Pinta las láminas de una pieza en canvas. Es la única pieza con DOM de las láminas; qué texto va
// en cada una, la tinta y la Onda salen de `laminas.ts`, que es pura.
//
// Cada papel tiene su composición, para que un carrusel tenga ritmo y no sean cuatro clones:
//   portada  gancho enorme abajo, la banda arriba en una píldora y la invitación a deslizar
//   paso     el número de la slide gigante en el acento y el texto debajo
//   cierre   el color se invierte (fondo = acento) y la llamada a la acción lleva su flecha
// Con foto, el texto se lee siempre: se mide la zona y se aplica el velo justo (el motor de Cartelería).
// La firma es siempre la Onda de la banda, a sangre por abajo, más el logo en una tinta si lo hay.

import { medirLuz, decidirTinta, type Tinta } from '../cartel/contraste';
import { dibujarFondoImagen } from '../cartel/arteCanvas';
import { aplicarGrano, semillaDeTexto } from '../cartel/grano';
import { canvasABlob, prepararFuentes, TINTAS } from '../cartel/render';
import { ajustarLineas } from '../cartel/texto';
import { velar } from '../cartel/velo';
import { VOCES, type VozCartel } from '../cartel/voces';
import { MEDIDAS, alturasOnda, disenoDe, type DisenoLaminas, type FormatoLamina, type Lamina } from './laminas';

const ONEST = '"Onest Variable", Onest, system-ui, sans-serif';
const MAX_LINEAS = 7;
/** Avance entre líneas por letra. La de cartel va en mayúsculas con tildes: necesita aire para que no choquen. */
const INTERLINEA: Record<VozCartel, number> = { moderna: 1.06, cartel: 1.18, clasica: 1.1 };
const BARRAS = 25;

const fuenteVoz = (voz: VozCartel, px: number) => `${VOCES[voz].peso} ${Math.round(px)}px ${VOCES[voz].familia}, ${ONEST}`;
const fuenteOnest = (peso: number, px: number) => `${peso} ${Math.round(px)}px ${ONEST}`;

function rectRedondeado(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** «→»: una línea y la punta, con el trazo redondeado. */
function flecha(ctx: CanvasRenderingContext2D, x: number, y: number, largo: number, grosor: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = grosor;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + largo, y);
  ctx.moveTo(x + largo - largo * 0.34, y - largo * 0.34);
  ctx.lineTo(x + largo, y);
  ctx.lineTo(x + largo - largo * 0.34, y + largo * 0.34);
  ctx.stroke();
  ctx.restore();
}

/**
 * Reparte el texto en las mismas líneas pero más parejas: «Entradas en la / bio» pasa a «Entradas /
 * en la bio». Busca el ancho más estrecho que no añade ninguna línea.
 */
function equilibrar(ctx: CanvasRenderingContext2D, texto: string, ancho: number): string[] {
  const medir = (t: string) => ctx.measureText(t).width;
  const lineas = ajustarLineas(texto, ancho, medir);
  if (lineas.length < 2) return lineas;
  let lo = ancho * 0.45;
  let hi = ancho;
  let mejor = lineas;
  for (let i = 0; i < 14; i++) {
    const medio = (lo + hi) / 2;
    const prueba = ajustarLineas(texto, medio, medir);
    if (prueba.length <= lineas.length && prueba.every((l) => medir(l) <= ancho)) {
      mejor = prueba;
      hi = medio;
    } else {
      lo = medio;
    }
  }
  return mejor;
}

/** El texto grande más grande que quepa: baja el cuerpo hasta que las líneas caben en ancho y alto. */
function encajarTexto(ctx: CanvasRenderingContext2D, texto: string, voz: VozCartel, ancho: number, alto: number, maxPx: number) {
  for (let px = maxPx; px >= 40; px -= 4) {
    ctx.font = fuenteVoz(voz, px);
    const lineas = ajustarLineas(texto, ancho, (t) => ctx.measureText(t).width);
    const interlinea = px * INTERLINEA[voz];
    if (lineas.length <= MAX_LINEAS && lineas.length * interlinea <= alto && lineas.every((l) => ctx.measureText(l).width <= ancho)) {
      return { px, lineas: equilibrar(ctx, texto, ancho), interlinea };
    }
  }
  ctx.font = fuenteVoz(voz, 40);
  return { px: 40, lineas: ajustarLineas(texto, ancho, (t) => ctx.measureText(t).width).slice(0, MAX_LINEAS), interlinea: 44 };
}

export interface OpcionesRender {
  formato: FormatoLamina;
  diseno: DisenoLaminas;
  voz: VozCartel;
  banda: string;
  /** Logo de la banda ya cargado y su URL (la caché de tintado va por URL). */
  logo?: { img: HTMLImageElement; url: string } | null;
  /** Foto de fondo de cada lámina (por posición); null = color. */
  fotos?: Array<HTMLImageElement | null>;
}

export function pintarLamina(canvas: HTMLCanvasElement, lamina: Lamina, opc: OpcionesRender): void {
  const { formato, voz, banda, logo = null } = opc;
  const foto = opc.fotos?.[lamina.numero - 1] ?? null;
  const m = MEDIDAS[formato];
  canvas.width = m.ancho;
  canvas.height = m.alto;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  const u = m.ancho / 1080;
  const cierre = lamina.papel === 'cierre';
  const numeroPaso = formato === 'carrusel' && lamina.papel === 'paso' ? lamina.numero - 1 : null;
  // El cierre invierte los colores para que la acción se vea: el acento pasa a ser el fondo.
  const d = cierre && !foto ? disenoDe({ fondo: opc.diseno.acento, acento: opc.diseno.fondo }) : opc.diseno;
  const mayus = (t: string) => (voz === 'cartel' ? t.toUpperCase() : t);

  const margen = 84 * u;
  const arriba = m.alto * m.seguroArriba + margen * 0.9;
  const baseOnda = m.alto * (1 - m.seguroAbajo);
  const ondaMax = 170 * u;
  const techo = arriba + 64 * u + 36 * u;
  const invita = formato === 'carrusel' && lamina.papel === 'portada';
  const suelo = baseOnda - ondaMax - 56 * u - (invita ? 64 * u : 0);

  // 1 · Fondo: foto a sangre o color plano.
  if (foto) dibujarFondoImagen(ctx, foto, m.ancho, m.alto);
  else {
    ctx.fillStyle = d.fondo;
    ctx.fillRect(0, 0, m.ancho, m.alto);
  }

  // 2 · El texto grande, medido antes de pintar para saber dónde cae.
  const maxPx = (lamina.papel === 'paso' ? 108 : cierre ? 128 : 150) * u * (formato === 'stories' ? 1.06 : 1);
  const numeral = numeroPaso ? 300 * u : 0;
  const { px, lineas, interlinea } = encajarTexto(ctx, mayus(lamina.texto), voz, m.ancho - 2 * margen, suelo - techo - numeral, maxPx);
  const altoBloque = lineas.length * interlinea;
  // El cierre lleva la flecha debajo y las stories dejan sitio a los stickers: van centrados.
  // Portada y pasos de un carrusel se apoyan abajo, como un cartel.
  const altoAccion = cierre ? 138 * u : 0;
  const centrar = cierre || formato === 'stories';
  const yTexto = centrar ? techo + (suelo - techo - altoBloque - altoAccion) / 2 : suelo - altoBloque;

  // 3 · Con foto: la tinta y el velo justos para que el texto se lea (4,5:1), como en Cartelería.
  let tinta = d.tinta;
  if (foto) {
    let t: Tinta = { tinta: 'clara', velo: 0.5 };
    try {
      const zona = ctx.getImageData(Math.round(margen), Math.max(0, Math.round(yTexto)), Math.round(m.ancho - 2 * margen), Math.max(1, Math.round(altoBloque)));
      t = decidirTinta(medirLuz(zona.data, 5, 0.04));
    } catch (e) {
      console.warn('[Asesor] No se pudo medir la foto; se usa un velo prudente:', e);
    }
    velar(ctx, { x: 0, y: yTexto - 40 * u, w: m.ancho, h: m.alto - yTexto + 40 * u }, t, false, Math.max(260 * u, altoBloque * 0.7));
    tinta = t.tinta === 'clara' ? TINTAS.clara : TINTAS.oscura;
  }

  // Lo pequeño (contador, «deslizar») va en el acento sobre color y en la tinta legible sobre foto.
  const detalle = foto ? tinta : d.acento;

  // 4 · La firma: la Onda de la banda a sangre por abajo.
  const alturas = alturasOnda(`${banda}|${lamina.texto}`, BARRAS);
  const paso = m.ancho / BARRAS;
  const ancho = paso * 0.58;
  ctx.fillStyle = d.acento;
  alturas.forEach((h, i) => {
    const alto = Math.max(ancho * 1.4, h * ondaMax);
    rectRedondeado(ctx, i * paso + (paso - ancho) / 2, baseOnda - alto, ancho, m.alto - (baseOnda - alto) + ancho, ancho / 2);
    ctx.fill();
  });

  // 5 · Cabecera: la banda en una píldora (portada y cierre) o el contador, y el logo a la derecha.
  ctx.textBaseline = 'middle';
  const yCab = arriba + 32 * u;
  if (numeroPaso === null && (lamina.papel === 'paso' || (formato === 'stories' && lamina.papel !== 'cierre'))) {
    ctx.font = fuenteOnest(700, 38 * u);
    ctx.fillStyle = detalle;
    ctx.fillText(`${lamina.numero}/${lamina.total}`, margen, yCab);
  } else {
    ctx.font = fuenteOnest(700, 30 * u);
    const nombre = banda.toUpperCase();
    ctx.save();
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${(3 * u).toFixed(1)}px`;
    const w = ctx.measureText(nombre).width + 52 * u;
    ctx.fillStyle = d.acento;
    rectRedondeado(ctx, margen, yCab - 31 * u, w, 62 * u, 31 * u);
    ctx.fill();
    ctx.fillStyle = disenoDe({ fondo: d.acento, acento: d.fondo }).tinta;
    ctx.fillText(nombre, margen + 26 * u, yCab + 1 * u);
    ctx.restore();
  }
  if (logo) {
    // En color y sobre una placa clara: un logo con detalle convertido en silueta sería un borrón.
    const alto = 120 * u;
    const k = Math.min((alto - 28 * u) / logo.img.height, (260 * u) / logo.img.width);
    const w = logo.img.width * k;
    const h = logo.img.height * k;
    const placa = w + 28 * u;
    ctx.fillStyle = TINTAS.clara;
    rectRedondeado(ctx, m.ancho - margen - placa, yCab - alto / 2, placa, alto, 26 * u);
    ctx.fill();
    ctx.drawImage(logo.img, m.ancho - margen - placa + 14 * u, yCab - h / 2, w, h);
  }

  // 6 · El número de la slide, gigante, en el acento.
  ctx.textBaseline = 'top';
  if (numeroPaso) {
    ctx.font = fuenteVoz(voz, 430 * u);
    ctx.fillStyle = detalle;
    // Se apoya por la línea base: cada letra de cartel tiene otra altura y así nunca pisa la cabecera.
    // La altura se mide con la misma línea base con la que se pinta.
    ctx.textBaseline = 'alphabetic';
    const cima = ctx.measureText(String(numeroPaso)).actualBoundingBoxAscent;
    ctx.fillText(String(numeroPaso), margen - 10 * u, techo + 8 * u + cima);
    ctx.textBaseline = 'top';
  }

  // 7 · El texto.
  ctx.font = fuenteVoz(voz, px);
  ctx.fillStyle = tinta;
  let y = yTexto;
  for (const linea of lineas) {
    ctx.fillText(linea, margen, y);
    y += interlinea;
  }

  // 8 · La acción del cierre y la invitación a deslizar.
  if (cierre) {
    const alto = 108 * u;
    ctx.fillStyle = tinta;
    rectRedondeado(ctx, margen, y + 30 * u, 230 * u, alto, alto / 2);
    ctx.fill();
    flecha(ctx, margen + 62 * u, y + 30 * u + alto / 2, 106 * u, 10 * u, foto ? (tinta === TINTAS.clara ? TINTAS.oscura : TINTAS.clara) : d.fondo);
  } else if (invita) {
    ctx.font = fuenteOnest(700, 34 * u);
    ctx.fillStyle = detalle;
    ctx.textBaseline = 'middle';
    const t = 'DESLIZA';
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${(3 * u).toFixed(1)}px`;
    const w = ctx.measureText(t).width;
    ctx.fillText(t, m.ancho - margen - w - 90 * u, suelo + 40 * u);
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = '0px';
    flecha(ctx, m.ancho - margen - 70 * u, suelo + 40 * u, 70 * u, 7 * u, detalle);
  }

  // 9 · Un poco de grano: que parezca impreso, no un rectángulo de color.
  aplicarGrano(ctx, m.ancho, m.alto, semillaDeTexto(`${banda}|${lamina.numero}`), foto ? 0.08 : 0.12);
}

/** Todas las láminas como PNG, en orden. */
export async function renderLaminas(laminas: Lamina[], opciones: OpcionesRender): Promise<Blob[]> {
  await prepararFuentes(opciones.voz);
  const blobs: Blob[] = [];
  for (const l of laminas) {
    const canvas = document.createElement('canvas');
    pintarLamina(canvas, l, opciones);
    blobs.push(await canvasABlob(canvas));
  }
  return blobs;
}
