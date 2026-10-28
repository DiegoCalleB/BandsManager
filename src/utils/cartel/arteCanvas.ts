// Dibujo de la ilustración de fondo en el lienzo. Solo canvas, sin decisiones de diseño.

export function dibujarFondoImagen(ctx: CanvasRenderingContext2D, img: HTMLImageElement | HTMLCanvasElement, ancho: number, alto: number) {
  const escala = Math.max(ancho / img.width, alto / img.height);
  const w = img.width * escala;
  const h = img.height * escala;
  ctx.drawImage(img, (ancho - w) / 2, (alto - h) / 2, w, h);
}

/**
 * Una ilustración con el título y la fecha DENTRO no se puede recortar (se comería letras): se pinta entera, a la
 * mayor escala que cabe, y lo que sobra por un lado se rellena con la propia imagen desenfocada. El borde de la
 * ilustración se funde con esa base para que no se vea la costura.
 */
export function dibujarArteEntero(ctx: CanvasRenderingContext2D, img: HTMLImageElement | HTMLCanvasElement, ancho: number, alto: number) {
  const escala = Math.min(ancho / img.width, alto / img.height);
  const w = Math.round(img.width * escala);
  const h = Math.round(img.height * escala);
  const x = Math.round((ancho - w) / 2);
  const y = Math.round((alto - h) / 2);
  if (w >= ancho - 1 && h >= alto - 1) {
    ctx.drawImage(img, 0, 0, ancho, alto);
    return;
  }
  ctx.save();
  ctx.filter = `blur(${Math.round(Math.max(ancho, alto) * 0.03)}px)`;
  dibujarFondoImagen(ctx, img, ancho, alto);
  ctx.restore();
  const capa = document.createElement('canvas');
  capa.width = w;
  capa.height = h;
  const c = capa.getContext('2d');
  if (!c) {
    ctx.drawImage(img, x, y, w, h);
    return;
  }
  c.drawImage(img, 0, 0, w, h);
  // Máscara con borde suave solo en los lados donde hay relleno. Se construye aparte y se aplica UNA vez:
  // cada relleno `destination-in` borraría lo que queda fuera de su rectángulo.
  const mascara = document.createElement('canvas');
  mascara.width = w;
  mascara.height = h;
  const m = mascara.getContext('2d');
  if (m) {
    const f = Math.round(Math.min(w, h) * 0.025);
    m.fillStyle = '#000';
    m.fillRect(0, 0, w, h);
    m.globalCompositeOperation = 'destination-out';
    const borde = (x0: number, y0: number, x1: number, y1: number, rx: number, ry: number, rw: number, rh: number) => {
      const g = m.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      m.fillStyle = g;
      m.fillRect(rx, ry, rw, rh);
    };
    if (w < ancho - 1) {
      borde(0, 0, f, 0, 0, 0, f, h);
      borde(w, 0, w - f, 0, w - f, 0, f, h);
    }
    if (h < alto - 1) {
      borde(0, 0, 0, f, 0, 0, w, f);
      borde(0, h, 0, h - f, 0, h - f, w, f);
    }
    c.globalCompositeOperation = 'destination-in';
    c.drawImage(mascara, 0, 0);
  }
  ctx.drawImage(capa, x, y);
}
