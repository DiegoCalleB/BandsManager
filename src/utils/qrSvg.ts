import QRCode from "qrcode";

/**
 * QR como SVG en línea (síncrono, sin red ni canvas): cabe en el HTML de impresión, que se mide
 * y se imprime tal cual. Negro puro sobre blanco con zona de silencio de 1 módulo; nivel M, que
 * es lo justo para una URL corta impresa en papel.
 */
export function buildQrSvg(value: string, sizeMm: number): string {
  const qr = QRCode.create(value, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const data = qr.modules.data;
  const quiet = 1;
  let path = "";
  for (let y = 0; y < n; y++) {
    let x = 0;
    while (x < n) {
      if (!data[y * n + x]) {
        x++;
        continue;
      }
      const start = x;
      while (x < n && data[y * n + x]) x++;
      path += `M${start + quiet} ${y + quiet}h${x - start}v1h-${x - start}z`;
    }
  }
  const total = n + quiet * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${sizeMm}mm" height="${sizeMm}mm" shape-rendering="crispEdges" role="img" aria-label="QR de BandManager"><rect width="${total}" height="${total}" fill="#fff"/><path d="${path}" fill="#000"/></svg>`;
}
