/**
 * Utilidades para exportación, descarga e impresión en máxima calidad (Vectorial SVG, PNG 4K 300 DPI y Flyer A4)
 * de Códigos QR para BandManager.ai (Captura de Fans en Concierto, Dossier EPK, Merchandising).
 */

export interface QrExportOptions {
  svgElementId?: string;
  svgElement?: SVGElement | null;
  filename?: string;
  bandName?: string;
  concertTitle?: string;
  dateCity?: string;
  url?: string;
  logoUrl?: string;
  ctaText?: string;
  resolution?: '4k' | '2k' | 'print300dpi' | 'standard';
  template?: 'qr-only' | 'poster-a4' | 'badge-card';
}

/**
 * Convierte una imagen (URL) a base64 Data URL para incrustarla en SVG o Canvas sin problemas de CORS.
 */
export async function urlToDataUrl(url: string): Promise<string> {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  try {
    const res = await fetch(url, { mode: 'cors' });
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  } catch {
    // Si falla fetch (CORS u offline), devolvemos la URL original
    return url;
  }
}

/**
 * Obtiene el SVG del código QR y lo limpia con atributos XML necesarios para ser un archivo .svg válido.
 */
export function getCleanSvgString(svgEl: SVGElement, includeLogo?: { dataUrl: string; sizePercent?: number }): string {
  const cloned = svgEl.cloneNode(true) as SVGElement;
  
  // Asegurar namespaces y viewBox
  cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  cloned.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  
  const viewBox = cloned.getAttribute('viewBox') || '0 0 256 256';
  const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number);
  const w = vbWidth || 256;
  const h = vbHeight || 256;

  if (includeLogo && includeLogo.dataUrl) {
    const logoSize = Math.round(w * (includeLogo.sizePercent || 0.22));
    const logoX = Math.round((w - logoSize) / 2);
    const logoY = Math.round((h - logoSize) / 2);
    const radius = Math.round(logoSize * 0.2);

    // Fondo blanco protector para el logo central
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', String(logoX - 4));
    bgRect.setAttribute('y', String(logoY - 4));
    bgRect.setAttribute('width', String(logoSize + 8));
    bgRect.setAttribute('height', String(logoSize + 8));
    bgRect.setAttribute('rx', String(radius + 2));
    bgRect.setAttribute('fill', '#ffffff');
    bgRect.setAttribute('stroke', '#f59e0b');
    bgRect.setAttribute('stroke-width', '2');
    cloned.appendChild(bgRect);

    // Imagen del logo
    const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    img.setAttribute('x', String(logoX));
    img.setAttribute('y', String(logoY));
    img.setAttribute('width', String(logoSize));
    img.setAttribute('height', String(logoSize));
    img.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', includeLogo.dataUrl);
    cloned.appendChild(img);
  }

  const serializer = new XMLSerializer();
  return serializer.serializeToString(cloned);
}

/**
 * 1. DESCARGA VECTORIAL SVG (MÁXIMA CALIDAD PARA IMPRENTA / DISEÑO)
 * Resolución matemática infinita, ideal para Illustrator, Corel, imprentas, roll-ups o lonas.
 */
export async function downloadQrAsSvg(options: QrExportOptions): Promise<void> {
  const svgEl = options.svgElement || (options.svgElementId ? document.querySelector<SVGElement>(`#${options.svgElementId} svg`) : null);
  if (!svgEl) {
    throw new Error('No se encontró el elemento SVG del código QR');
  }

  let logoDataUrl = '';
  if (options.logoUrl) {
    logoDataUrl = await urlToDataUrl(options.logoUrl);
  }

  const svgString = getCleanSvgString(svgEl, logoDataUrl ? { dataUrl: logoDataUrl } : undefined);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${options.filename || 'codigo-qr-bandmanager-vectorial'}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 2. DESCARGA PNG EN ULTRA ALTA RESOLUCIÓN (4K / 300 DPI)
 * Genera un archivo PNG ultranítido listo para carteles, flyers, pegatinas o pantallas.
 */
export async function downloadQrAsHighResPng(options: QrExportOptions): Promise<void> {
  const svgEl = options.svgElement || (options.svgElementId ? document.querySelector<SVGElement>(`#${options.svgElementId} svg`) : null);
  if (!svgEl) {
    throw new Error('No se encontró el elemento SVG del código QR');
  }

  let logoImg: HTMLImageElement | null = null;
  if (options.logoUrl) {
    try {
      const dataUrl = await urlToDataUrl(options.logoUrl);
      logoImg = await new Promise((res, rej) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => res(img);
        img.onerror = () => res(null);
        img.src = dataUrl;
      });
    } catch {
      logoImg = null;
    }
  }

  const template = options.template || 'qr-only';
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo inicializar el contexto de Canvas');

  // Convertir SVG a Image para dibujarlo en el Canvas a resolución ultra alta
  const svgString = getCleanSvgString(svgEl);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);
  const qrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = svgUrl;
  });

  if (template === 'poster-a4') {
    // Proporción A4 a 300 DPI: 2480 x 3508 px
    canvas.width = 2480;
    canvas.height = 3508;

    // Fondo blanco elegante con marco ámbar
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Borde exterior ámbar / dorado
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 24;
    ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);

    // Cabecera con Logo de la Banda si existe
    let curY = 240;
    if (logoImg) {
      const maxLogoW = 700;
      const maxLogoH = 260;
      const ratio = Math.min(maxLogoW / logoImg.width, maxLogoH / logoImg.height, 1);
      const lw = logoImg.width * ratio;
      const lh = logoImg.height * ratio;
      ctx.drawImage(logoImg, (canvas.width - lw) / 2, curY, lw, lh);
      curY += lh + 60;
    }

    // Título de la Banda
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 80px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((options.bandName || 'BANDMANAGER').toUpperCase(), canvas.width / 2, curY);
    curY += 70;

    // Concierto / Sala / Ciudad
    if (options.concertTitle) {
      ctx.fillStyle = '#f59e0b';
      ctx.font = '800 52px system-ui, -apple-system, sans-serif';
      ctx.fillText(options.concertTitle.toUpperCase(), canvas.width / 2, curY);
      curY += 60;
    }
    if (options.dateCity) {
      ctx.fillStyle = '#64748b';
      ctx.font = '600 40px monospace';
      ctx.fillText(options.dateCity, canvas.width / 2, curY);
      curY += 70;
    }

    // Mensaje de llamada a la acción (CTA)
    curY += 40;
    ctx.fillStyle = '#1e293b';
    ctx.font = '700 48px system-ui, -apple-system, sans-serif';
    const cta = options.ctaText || '¡ESCANEA CON LA CÁMARA DE TU MÓVIL!';
    ctx.fillText(cta, canvas.width / 2, curY);
    curY += 70;

    // Subtítulo explicativo
    ctx.fillStyle = '#64748b';
    ctx.font = '500 36px system-ui, -apple-system, sans-serif';
    ctx.fillText('Accede a contenido exclusivo, canciones inéditas y sorteos de merch', canvas.width / 2, curY);
    curY += 90;

    // Código QR Central Gigante (1400 x 1400 px)
    const qrSize = 1400;
    const qrX = (canvas.width - qrSize) / 2;
    const qrY = curY;

    // Caja de fondo del QR
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 20;
    ctx.fillRect(qrX - 40, qrY - 40, qrSize + 80, qrSize + 80);
    ctx.shadowColor = 'transparent';

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 16;
    ctx.strokeRect(qrX - 40, qrY - 40, qrSize + 80, qrSize + 80);

    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

    // Overlay del logo en el centro del QR
    if (logoImg) {
      const centerLogoSize = 280;
      const cx = qrX + (qrSize - centerLogoSize) / 2;
      const cy = qrY + (qrSize - centerLogoSize) / 2;
      
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.roundRect(cx - 16, cy - 16, centerLogoSize + 32, centerLogoSize + 32, 24);
      ctx.fill();
      ctx.stroke();

      ctx.drawImage(logoImg, cx, cy, centerLogoSize, centerLogoSize);
    }

    curY = qrY + qrSize + 140;

    // URL legible en el pie de página
    if (options.url) {
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 36px monospace';
      ctx.fillText(options.url, canvas.width / 2, curY);
    }

    // Pie de marca
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 28px system-ui, -apple-system, sans-serif';
    ctx.fillText('BandManager.ai • Gestión y Captura de Fans para Músicos', canvas.width / 2, canvas.height - 100);

  } else if (template === 'badge-card') {
    // Tarjeta Cuadrada para Merchandising / Pegatina 2400 x 2400 px
    canvas.width = 2400;
    canvas.height = 2400;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 20;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    let curY = 180;
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 70px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((options.bandName || 'ÚNETE A LA COMUNIDAD').toUpperCase(), canvas.width / 2, curY);
    curY += 70;

    if (options.concertTitle) {
      ctx.fillStyle = '#f59e0b';
      ctx.font = '700 44px system-ui, -apple-system, sans-serif';
      ctx.fillText(options.concertTitle, canvas.width / 2, curY);
      curY += 70;
    }

    const qrSize = 1500;
    const qrX = (canvas.width - qrSize) / 2;
    const qrY = curY + 20;

    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

    if (logoImg) {
      const centerLogoSize = 300;
      const cx = qrX + (qrSize - centerLogoSize) / 2;
      const cy = qrY + (qrSize - centerLogoSize) / 2;
      
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.roundRect(cx - 16, cy - 16, centerLogoSize + 32, centerLogoSize + 32, 24);
      ctx.fill();
      ctx.stroke();

      ctx.drawImage(logoImg, cx, cy, centerLogoSize, centerLogoSize);
    }

    curY = qrY + qrSize + 100;
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 36px monospace';
    ctx.fillText(options.url || '', canvas.width / 2, curY);

  } else {
    // QR-ONLY (3000 x 3000 px Ultra HD limpio para maquetadores)
    const dim = 3000;
    canvas.width = dim;
    canvas.height = dim;

    // Fondo blanco puro
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, dim, dim);

    // Padding de silencio de 200px
    const pad = 200;
    const qrSize = dim - (pad * 2);
    ctx.drawImage(qrImg, pad, pad, qrSize, qrSize);

    // Logo central integrado en HD
    if (logoImg) {
      const centerLogoSize = Math.round(qrSize * 0.22);
      const cx = pad + (qrSize - centerLogoSize) / 2;
      const cy = pad + (qrSize - centerLogoSize) / 2;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.roundRect(cx - 20, cy - 20, centerLogoSize + 40, centerLogoSize + 40, 32);
      ctx.fill();
      ctx.stroke();

      ctx.drawImage(logoImg, cx, cy, centerLogoSize, centerLogoSize);
    }
  }

  URL.revokeObjectURL(svgUrl);

  // Descarga como archivo PNG
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${options.filename || 'codigo-qr-ultra-hd'}-${template}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 'image/png', 1.0);
}

/**
 * 3. IMPRESIÓN DIRECTA EN A4 / PDF CON CSS VECTORIAL NATIVO
 * Abre un diálogo de impresión maquetado con estilos A4 listos para imprimir en cualquier impresora o guardar como PDF vectorial.
 */
export function printHighQualityFlyer(options: {
  svgElementId?: string;
  svgElement?: SVGElement | null;
  bandName?: string;
  concertTitle?: string;
  dateCity?: string;
  url: string;
  logoUrl?: string;
  ctaText?: string;
  subtitle?: string;
}) {
  const svgEl = options.svgElement || (options.svgElementId ? document.querySelector<SVGElement>(`#${options.svgElementId} svg`) : null);
  if (!svgEl) {
    alert('No se pudo encontrar el código QR para imprimir');
    return;
  }

  const svgString = getCleanSvgString(svgEl);
  const printWin = window.open('', '_blank');
  if (!printWin) {
    alert('Por favor habilita las ventanas emergentes (pop-ups) en tu navegador para imprimir el cartel.');
    return;
  }

  const bandName = options.bandName || 'BANDA';
  const concertTitle = options.concertTitle || 'Directo en Vivo';
  const dateCity = options.dateCity || '';
  const url = options.url || '';
  const logoUrl = options.logoUrl || '';
  const cta = options.ctaText || '¡ESCANEA CON TU MÓVIL!';
  const subtitle = options.subtitle || 'Únete a nuestra comunidad oficial, accede a canciones inéditas, sorpresas exclusivas y sorteos.';

  printWin.document.write(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Cartel QR A4 - ${bandName} ${concertTitle ? `(${concertTitle})` : ''}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #ffffff;
            color: #0f172a;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .poster {
            width: 100%;
            max-width: 680px;
            margin: 0 auto;
            border: 6px solid #f59e0b;
            border-radius: 28px;
            padding: 40px 32px;
            text-align: center;
            background: #ffffff;
            position: relative;
          }
          .logo-box {
            margin: 0 auto 16px auto;
            max-width: 220px;
            max-height: 90px;
          }
          .logo-box img {
            max-width: 100%;
            max-height: 90px;
            object-fit: contain;
          }
          h1.band-title {
            font-size: 32px;
            font-weight: 900;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 1px;
            line-height: 1.1;
            margin-bottom: 6px;
          }
          h2.concert-title {
            font-size: 22px;
            font-weight: 800;
            color: #d97706;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          p.date-city {
            font-size: 15px;
            font-weight: 600;
            color: #64748b;
            font-family: monospace;
            margin-bottom: 24px;
          }
          .cta-banner {
            background: #0f172a;
            color: #ffffff;
            padding: 12px 20px;
            border-radius: 16px;
            font-size: 18px;
            font-weight: 800;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
            display: inline-block;
          }
          p.desc {
            font-size: 14px;
            color: #475569;
            line-height: 1.4;
            max-width: 480px;
            margin: 0 auto 20px auto;
            font-weight: 500;
          }
          .qr-wrapper {
            position: relative;
            display: inline-block;
            padding: 20px;
            background: #ffffff;
            border: 4px solid #f59e0b;
            border-radius: 24px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.08);
          }
          .qr-wrapper svg {
            width: 280px;
            height: 280px;
            display: block;
          }
          .qr-center-logo {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 64px;
            height: 64px;
            background: #ffffff;
            border-radius: 16px;
            border: 3px solid #f59e0b;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            padding: 4px;
          }
          .qr-center-logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .url-box {
            margin-top: 24px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 10px 16px;
            font-family: monospace;
            font-size: 13px;
            color: #334155;
            font-weight: 700;
            word-break: break-all;
          }
          .footer-note {
            margin-top: 20px;
            font-size: 11px;
            color: #94a3b8;
            font-weight: 500;
          }
          @media print {
            body {
              min-height: auto;
              padding: 0;
            }
            .poster {
              box-shadow: none;
              border-width: 4px;
              padding: 28px 24px;
            }
            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="poster">
          ${logoUrl ? `<div class="logo-box"><img src="${logoUrl}" alt="${bandName}" /></div>` : ''}
          <h1 class="band-title">${bandName}</h1>
          ${concertTitle ? `<h2 class="concert-title">${concertTitle}</h2>` : ''}
          ${dateCity ? `<p class="date-city">${dateCity}</p>` : ''}
          
          <div class="cta-banner">${cta}</div>
          <p class="desc">${subtitle}</p>

          <div class="qr-wrapper">
            <div id="svg-container">${svgString}</div>
            ${logoUrl ? `
              <div class="qr-center-logo">
                <img src="${logoUrl}" alt="Logo" />
              </div>
            ` : ''}
          </div>

          <div class="url-box">${url}</div>
          <div class="footer-note">BandManager.ai • Diseñado para imprimir en A4 y colocar en barras, taquilla, roll-ups o escenario</div>
        </div>
        <script>
          setTimeout(() => {
            window.print();
          }, 350);
        </script>
      </body>
    </html>
  `);
  printWin.document.close();
}
