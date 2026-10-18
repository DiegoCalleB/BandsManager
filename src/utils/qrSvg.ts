import QRCode from "qrcode";

/**
 * QR como SVG en línea (síncrono, sin red ni canvas): cabe en el HTML de impresión, que se mide
 * y se imprime tal cual. Negro puro sobre blanco con zona de silencio de 1 módulo; nivel M, que
 * es lo justo para una URL corta impresa en papel. Con `level` "H" tolera tapar el centro con un logo, que se pasa en `logoHref`.
 */
export function buildQrSvg(value: string, sizeMm: number, level: "M" | "H" = "M", logoHref?: string): string {
  const qr = QRCode.create(value, { errorCorrectionLevel: level });
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
  const c = total / 2;
  const side = total * 0.2;
  const href = logoHref?.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const logo = href
    ? `<circle cx="${c}" cy="${c}" r="${side * 0.68}" fill="#fff"/><image href="${href}" xlink:href="${href}" x="${c - side / 2}" y="${c - side / 2}" width="${side}" height="${side}" preserveAspectRatio="xMidYMid meet"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${total} ${total}" width="${sizeMm}mm" height="${sizeMm}mm" shape-rendering="crispEdges" role="img" aria-label="QR de BandManager"><rect width="${total}" height="${total}" fill="#fff"/><path d="${path}" fill="#000"/>${logo}</svg>`;
}
