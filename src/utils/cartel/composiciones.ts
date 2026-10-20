// Las composiciones del cartel: tres maneras de repartir las mismas piezas (nombre, fecha, datos, QR, logos).
// Un cartel de verdad no siempre pone el nombre arriba y los datos abajo.
//
//   ventana   el nombre arriba, a la izquierda, la ilustración en medio y los datos abajo. La de siempre.
//   centrada  simétrica, con filetes y rombo: la del cartel de club, el vintage, el jazz.
//   base      la fecha y el sitio arriba en pequeño y el NOMBRE enorme abajo: la del cartel de festival.
//
// Todas son puras (medidor inyectado) y devuelven el mismo `LayoutCartel`.

import {
  apilarDatos,
  colocarFecha,
  colocarPie,
  construirNombre,
  encajar,
  fechaCompuesta,
  filaDeLogos,
  type Adorno,
  type CtxLayout,
  type LayoutCartel,
  type Linea,
  type Rect,
} from './layoutBase';

/** Reparte la fila de logos con su borde inferior en `yBase - hueco`; `centroX` los centra, si no van desde `x0`. */
function logosEn(c: CtxLayout, techo: number, x0: number, centroX?: number): { logos: Rect[]; techo: number } {
  const fila = filaDeLogos(c.opciones.logos ?? [], x0, 0, c.util, c.u);
  if (!fila.rects.length) return { logos: [], techo };
  const yFila = techo - 34 * c.u - fila.alto;
  let dx = 0;
  if (centroX !== undefined) {
    const ini = fila.rects[0].x;
    const fin = fila.rects[fila.rects.length - 1].x + fila.rects[fila.rects.length - 1].w;
    dx = centroX - (ini + fin) / 2;
  }
  return { logos: fila.rects.map((r) => ({ ...r, x: r.x + dx, y: r.y + yFila })), techo: yFila };
}

const filete = (c: CtxLayout, x: number, y: number, w: number, rombo: boolean): Adorno => ({ x, y, w, grosor: Math.max(2, Math.round(3 * c.u)), rombo });

export function composicionVentana(c: CtxLayout): LayoutCartel {
  const { def, ancho, alto, u, m, util, opciones } = c;

  const nombre = construirNombre(c, m, m + def.seguroArriba * alto, util, 'left', true);
  const arriba: Rect = { x: 0, y: 0, w: ancho, h: Math.min(alto, nombre.yFin + m * 0.6) };

  const pie = colocarPie(c, alto - m - def.seguroAbajo * alto);
  const fondo = pie.fondo;
  const ladoQr = opciones.qr ? Math.round(230 * u) : 0;
  const anchoDatos = opciones.qr ? util - ladoQr - 40 * u : util;
  const datos = apilarDatos(c, { alinear: 'left', x: m, ancho: anchoDatos, fondo });

  const qr: Rect | null = opciones.qr ? { x: ancho - m - ladoQr, y: fondo - ladoQr, w: ladoQr, h: ladoQr } : null;
  // La fila de logos va justo encima de lo más alto de los datos (o del QR, si sobresale).
  const { logos, techo } = logosEn(c, Math.min(datos.yTop, qr ? qr.y : datos.yTop), m);
  const techoAbajo = Math.max(0, techo - m * 0.6);

  return {
    ancho,
    alto,
    lineas: [...nombre.lineas, ...pie.lineas, ...datos.lineas],
    qr,
    logos,
    titulo: nombre.titulo,
    adornos: [],
    zonas: { arriba, abajo: { x: 0, y: techoAbajo, w: ancho, h: alto - techoAbajo } },
  };
}

export function composicionCentrada(c: CtxLayout): LayoutCartel {
  const { def, ancho, alto, u, m, util, opciones } = c;
  const cx = ancho / 2;

  const nombre = construirNombre(c, cx, m + def.seguroArriba * alto, util, 'center', true);
  // Un filete con rombo cierra el nombre, como el de un cartel de club.
  const yFilete = nombre.yFin + 18 * u;
  const adornos: Adorno[] = [filete(c, m + util * 0.16, yFilete, util * 0.68, true)];
  const arriba: Rect = { x: 0, y: 0, w: ancho, h: Math.min(alto, yFilete + m * 0.55) };

  const pie = colocarPie(c, alto - m - def.seguroAbajo * alto);
  const fondo = pie.fondo;
  const ladoQr = opciones.qr ? Math.round(230 * u) : 0;
  const anchoDatos = opciones.qr ? util - ladoQr - 40 * u : util;
  // Los datos van centrados en el espacio que deja el QR (si lo hay), no en el cartel entero.
  const cxDatos = m + anchoDatos / 2;
  const datos = apilarDatos(c, { alinear: 'center', x: cxDatos, ancho: anchoDatos, fondo });
  adornos.push(filete(c, cxDatos - anchoDatos * 0.3, datos.yTop - 26 * u, anchoDatos * 0.6, true));

  const qr: Rect | null = opciones.qr ? { x: ancho - m - ladoQr, y: fondo - ladoQr, w: ladoQr, h: ladoQr } : null;
  const { logos, techo } = logosEn(c, Math.min(datos.yTop - 26 * u - 14 * u, qr ? qr.y : Infinity), m, cxDatos);
  const techoAbajo = Math.max(0, techo - m * 0.6);

  return {
    ancho,
    alto,
    lineas: [...nombre.lineas, ...pie.lineas, ...datos.lineas],
    qr,
    logos,
    titulo: nombre.titulo,
    adornos,
    zonas: { arriba, abajo: { x: 0, y: techoAbajo, w: ancho, h: alto - techoAbajo } },
  };
}

export function composicionBase(c: CtxLayout): LayoutCartel {
  const { def, ancho, alto, u, m, util, voz, medir, datos: d, opciones } = c;

  // ---------- arriba, en pequeño: la fecha a la izquierda; sala y horas a la derecha ----------
  const y0 = m + def.seguroArriba * alto;
  const lineas: Linea[] = [];
  let altoIzq = 0;
  const comp = fechaCompuesta(c, util * 0.58);
  if (comp) {
    lineas.push(...colocarFecha(comp, voz, m, y0));
    altoIzq = comp.alto;
  } else if (d.fecha.trim()) {
    const px = Math.round(64 * u);
    lineas.push({ texto: d.fecha, x: m, y: y0, px, peso: 800, alinear: 'left' });
    altoIzq = px * 1.08;
  }
  const lugar = [d.sala, d.ciudad].map((s) => s.trim().toUpperCase()).filter(Boolean);
  const anchoDer = util * 0.4;
  let yDer = y0;
  if (lugar.length) {
    const { px, lineas: ls } = encajar(lugar, ' · ', anchoDer, 2, Math.round(42 * u), Math.round(26 * u), 700, medir, '', false, 0.05);
    for (const t of ls) {
      lineas.push({ texto: t, x: ancho - m, y: yDer, px, peso: 700, alinear: 'right', tracking: 0.05 });
      yDer += px * 1.1;
    }
  }
  if (d.horario.trim()) {
    const { px, lineas: ls } = encajar(d.horario.split(' · '), ' · ', anchoDer, 2, Math.round(30 * u), Math.round(22 * u), 600, medir, '', false, 0.06);
    yDer += 6 * u;
    for (const t of ls) {
      lineas.push({ texto: t, x: ancho - m, y: yDer, px, peso: 600, alinear: 'right', tracking: 0.06 });
      yDer += px * 1.1;
    }
  }
  const arriba: Rect = { x: 0, y: 0, w: ancho, h: Math.min(alto, Math.max(y0 + altoIzq, yDer) + m * 0.6) };

  // ---------- abajo: el nombre enorme (todo el ancho), y bajo él la fila del QR con la línea extra ----------
  const pie = colocarPie(c, alto - m - def.seguroAbajo * alto);
  let fondo = pie.fondo;
  const ladoQr = opciones.qr ? Math.round(230 * u) : 0;
  const qr: Rect | null = opciones.qr ? { x: ancho - m - ladoQr, y: fondo - ladoQr, w: ladoQr, h: ladoQr } : null;

  const extra = d.extra.trim().toUpperCase();
  const lineasAbajo: Linea[] = [];
  if (extra) {
    const px = Math.round(34 * u);
    lineasAbajo.push({ texto: extra, x: m, y: fondo - px * 1.08, px, peso: 600, alinear: 'left', tracking: 0.06 });
  }
  // La fila (QR y/o extra) ocupa lo que mida el QR o la línea extra.
  fondo -= Math.max(ladoQr, extra ? Math.round(34 * u) * 1.08 : 0);
  if (qr || extra) fondo -= 26 * u;
  // El nombre se construye desde 0 para saber lo que mide y se baja hasta apoyarlo en `fondo`.
  const prueba = construirNombre(c, m, 0, util, 'left', true, true);
  const dy = fondo - prueba.yFin;
  const nombreLineas = prueba.lineas.map((l) => ({ ...l, y: l.y + dy }));
  const titulo: Rect | null = prueba.titulo ? { ...prueba.titulo, y: prueba.titulo.y + dy } : null;
  const yTopNombre = nombreLineas[0]?.y ?? fondo;

  const { logos, techo } = logosEn(c, yTopNombre, m);
  const techoAbajo = Math.max(0, techo - m * 0.6);

  return {
    ancho,
    alto,
    lineas: [...lineas, ...nombreLineas, ...lineasAbajo, ...pie.lineas],
    qr,
    logos,
    titulo,
    adornos: [],
    zonas: { arriba, abajo: { x: 0, y: techoAbajo, w: ancho, h: alto - techoAbajo } },
  };
}
