// Textos del cartel: fecha legible y reparto en líneas. Puro, sin DOM.

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

/** `20:30` válido o null. La hoja de ruta rellena 21:30 por defecto: solo se pinta lo que alguien escribió. */
export function horaValida(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(valor.trim());
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : null;
}

/** «PUERTAS 20:30 · SHOW 21:30», o solo la que haya. */
export function lineaHorario(puertas?: string | null, show?: string | null): string {
  const p = horaValida(puertas);
  const s = horaValida(show);
  return [p && `PUERTAS ${p}`, s && `SHOW ${s}`].filter(Boolean).join(' · ');
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

/**
 * Como `ajustarLineas`, pero corta entre piezas (bandas, sala/ciudad) antes que dentro de una:
 * «CON LOS PIJAMAS · INVITADA SORPRESA» nunca parte «INVITADA / SORPRESA» si cabe entera.
 * Una pieza que no cabe sola en una línea se reparte por palabras. `prefijoAlCortar` se antepone
 * a la pieza que abre línea tras un corte: «UNO / + DOS», para que no parezca una sola banda.
 */
export function ajustarPiezas(piezas: string[], sep: string, ancho: number, medir: (t: string) => number, prefijoAlCortar = ''): string[] {
  const lineas: string[] = [];
  let actual = '';
  for (const pieza of piezas.map((p) => p.trim()).filter(Boolean)) {
    const prueba = actual ? `${actual}${sep}${pieza}` : pieza;
    if (medir(prueba) <= ancho) {
      actual = prueba;
      continue;
    }
    const tras = actual ? `${prefijoAlCortar}${pieza}` : pieza;
    if (actual) lineas.push(actual);
    if (medir(tras) <= ancho) {
      actual = tras;
    } else {
      const partes = ajustarLineas(tras, ancho, medir);
      lineas.push(...partes.slice(0, -1));
      actual = partes[partes.length - 1] ?? '';
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}
