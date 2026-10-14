// Composición del cartel: la IA pinta el fondo y aquí se pone el texto real encima.
// `datosCartel` y `ajustarLineas` son puras (se prueban sin DOM); `dibujarCartel` usa un canvas.

export const ANCHO_CARTEL = 1080;
export const ALTO_CARTEL = 1350; // 4:5, el formato del feed de Instagram.

export interface DatosCartel {
  banda: string;
  sala: string;
  ciudad: string;
  /** «SÁB 14 NOV 2026». Vacío si la fecha no es válida. */
  fecha: string;
}

const DIAS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

/** `2026-11-14` → `SÁB 14 NOV 2026`. Se lee en UTC para que la zona horaria no mueva el día. */
export function fechaCartel(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  if (!m) return '';
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (Number.isNaN(d.getTime())) return '';
  return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function datosCartel(c: { fecha: string; sala: string; ciudad?: string }, banda: string): DatosCartel {
  return {
    banda: banda.trim(),
    sala: (c.sala || '').trim(),
    ciudad: (c.ciudad || '').trim(),
    fecha: fechaCartel(c.fecha),
  };
}

/** Reparte palabras en líneas que quepan en `ancho` según `medir`. Una palabra más larga que el ancho va sola. */
export function ajustarLineas(texto: string, ancho: number, medir: (t: string) => number): string[] {
  const lineas: string[] = [];
  let actual = '';
  for (const palabra of texto.split(/\s+/).filter(Boolean)) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (actual && medir(prueba) > ancho) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = prueba;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

function cargarImagen(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar el fondo del cartel.'));
    img.src = url;
  });
}

/** Dibuja fondo + texto en el canvas. Franjas planas translúcidas arriba y abajo para que el texto se lea sobre cualquier fondo. */
export async function dibujarCartel(canvas: HTMLCanvasElement, fondoUrl: string, datos: DatosCartel): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Tu navegador no puede dibujar el cartel.');
  canvas.width = ANCHO_CARTEL;
  canvas.height = ALTO_CARTEL;

  const img = await cargarImagen(fondoUrl);
  // Cubrir el lienzo sin deformar la imagen.
  const escala = Math.max(ANCHO_CARTEL / img.width, ALTO_CARTEL / img.height);
  const w = img.width * escala;
  const h = img.height * escala;
  ctx.drawImage(img, (ANCHO_CARTEL - w) / 2, (ALTO_CARTEL - h) / 2, w, h);

  const margen = 72;
  const util = ANCHO_CARTEL - margen * 2;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, ANCHO_CARTEL, 400);
  ctx.fillRect(0, ALTO_CARTEL - 340, ANCHO_CARTEL, 340);

  ctx.fillStyle = '#F4F1EA';
  ctx.textBaseline = 'top';
  ctx.font = '800 120px Onest, system-ui, sans-serif';
  const lineasBanda = ajustarLineas(datos.banda.toUpperCase(), util, (t) => ctx.measureText(t).width).slice(0, 3);
  lineasBanda.forEach((l, i) => ctx.fillText(l, margen, 64 + i * 120));

  ctx.font = '700 64px Onest, system-ui, sans-serif';
  ctx.fillText(datos.fecha, margen, ALTO_CARTEL - 300);
  ctx.font = '600 48px Onest, system-ui, sans-serif';
  const lugar = [datos.sala, datos.ciudad].filter(Boolean).join(' · ');
  ajustarLineas(lugar.toUpperCase(), util, (t) => ctx.measureText(t).width)
    .slice(0, 2)
    .forEach((l, i) => ctx.fillText(l, margen, ALTO_CARTEL - 214 + i * 60));
}
