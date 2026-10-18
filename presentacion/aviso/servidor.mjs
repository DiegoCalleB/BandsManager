// Aviso real de «Alguien está viendo tu TFM»: cuando quien ve la película llega a la escena «El reloj», la presentación hace POST /aviso
// y este servidor (detrás de Caddy, solo en 127.0.0.1) manda UN correo con Resend. Sin dependencias.
//
// Seguro por defecto: NO envía nada salvo que se active a propósito con variables de entorno (en Railway, en el servicio de la presentación):
//   AVISO_ACTIVO   1 = envía de verdad · ensayo = no envía, solo escribe en el log lo que enviaría · cualquier otra cosa (o ausente) = apagado
//   RESEND_API_KEY clave de Resend (nunca en el repositorio)
//   AVISO_DESTINO  a quién (no hay destinatario por defecto en el código)
//   AVISO_ORIGENES hosts desde los que se acepta la petición, separados por comas (por defecto, la web de la presentación)
//   AVISO_REMITENTE (opcional) remitente; por defecto «BandManager <avisos@bandmanager.io>» (dominio verificado en Resend)
//   AVISO_MIN_HORAS (opcional) horas mínimas entre dos avisos, por defecto 6 (limite global, también protege de abusos)
import http from 'node:http';

const PUERTO = Number(process.env.AVISO_PUERTO || 8787);
const modo = () => (process.env.AVISO_ACTIVO === '1' ? 'real' : process.env.AVISO_ACTIVO === 'ensayo' ? 'ensayo' : 'apagado');
const ESCENAS = new Set(['El reloj']);
let ultimo = 0;

const origenOk = (req) => {
  const permitidos = (process.env.AVISO_ORIGENES || 'presentacion-storytelling.up.railway.app').split(',').map((s) => s.trim()).filter(Boolean);
  try { return permitidos.includes(new URL(req.headers.origin || '').host); } catch { return false; }
};

const correo = (escena) => ({
  asunto: 'BandManager · Alguien está viendo tu TFM',
  texto: `Ahora mismo. Desde el principio.\n\nEste aviso es real: es el aviso de lectura de BandManager, el mismo que le avisa a la banda cuando una sala abre su correo. Acabas de llegar a la escena «${escena}» de la película y la presentación te lo cuenta en vivo.\n\nDiego de la Calle · BandManager.io`,
  html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#111"><p style="font-size:12px;letter-spacing:.12em;color:#888">BANDMANAGER · AHORA</p><h2 style="margin:6px 0">Alguien está viendo tu TFM</h2><p style="font-size:18px">Ahora mismo. Desde el principio.</p><p>Este aviso es real: es el aviso de lectura de BandManager, el mismo que le avisa a la banda cuando una sala abre su correo. Acabas de llegar a la escena «${escena}» de la película y la presentación te lo cuenta en vivo.</p><p style="color:#666">Diego de la Calle · BandManager.io</p></div>`,
});

// Cuántos fans tiene Os Herdeiros do Código en BandManager (solo el número). La película lo consulta cada pocos segundos durante la pausa del QR
// para saber cuándo alguien se ha hecho fan. Va por aquí (servidor a servidor) y con la banda fija: desde el navegador no se puede pedir otra.
const FANS_URL = process.env.FANS_CONTADOR_URL || 'https://bandmanager.io/api/public/fans/contador?b=t_AAAAAEAOHUwPAAA7FgwRGgFIOxxMDxs7W1dd';
let contado = { t: 0, total: null, ultimo: null };
// Devuelve el número de fans y, si el servidor lo permite para esta banda, el nombre de pila de quien se ha hecho fan hace menos de tres minutos
const fansTotal = async () => {
  if (Date.now() - contado.t < 1500) return contado;
  try {
    const r = await fetch(FANS_URL, { signal: AbortSignal.timeout(4000) });
    const j = r.ok ? await r.json() : null;
    const nombre = j && j.ultimo && typeof j.ultimo.nombre === 'string' ? j.ultimo.nombre.replace(/[^\p{L}'-]/gu, '').slice(0, 24) : '';
    contado = { t: Date.now(), total: j && Number.isInteger(j.total) ? j.total : null, ultimo: nombre ? { nombre } : null };
  } catch { contado = { t: Date.now(), total: null, ultimo: null }; }
  return contado;
};

const servidor = http.createServer(async (req, res) => {
  const fin = (codigo, cuerpo = '') => { res.writeHead(codigo, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(cuerpo)); };
  if (req.method === 'GET' && req.url.startsWith('/fans-contador')) { const c = await fansTotal(); return fin(200, { total: c.total, ultimo: c.ultimo }); }
  if (req.method !== 'POST' || !req.url.startsWith('/aviso')) return fin(404);
  const m = modo();
  if (m === 'apagado') return fin(200, { enviado: false, motivo: 'apagado' }); // el estado por defecto
  if (!origenOk(req)) return fin(403, { enviado: false, motivo: 'origen' });
  let escena;
  try { const trozos = []; for await (const t of req) { trozos.push(t); if (trozos.join('').length > 2000) return fin(413); } escena = JSON.parse(trozos.join('') || '{}').escena; } catch { return fin(400); }
  if (!ESCENAS.has(escena)) return fin(400, { enviado: false, motivo: 'escena' });
  const espera = Number(process.env.AVISO_MIN_HORAS || 6) * 3600e3;
  if (Date.now() - ultimo < espera) return fin(200, { enviado: false, motivo: 'ya enviado hace poco' });
  const c = correo(escena), destino = process.env.AVISO_DESTINO, clave = process.env.RESEND_API_KEY;
  if (m === 'ensayo') { console.log(`[aviso] ENSAYO (no se envía): a ${destino || '(sin AVISO_DESTINO)'} · «${c.asunto}»`); ultimo = Date.now(); return fin(200, { enviado: false, motivo: 'ensayo' }); }
  if (!destino || !clave) { console.log('[aviso] falta AVISO_DESTINO o RESEND_API_KEY: no se envía'); return fin(200, { enviado: false, motivo: 'sin configurar' }); }
  ultimo = Date.now(); // se marca antes de enviar: un fallo nunca se reintenta en bucle
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${clave}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.AVISO_REMITENTE || 'BandManager <avisos@bandmanager.io>', to: [destino], subject: c.asunto, text: c.texto, html: c.html }),
    });
    console.log(`[aviso] enviado (${r.status})`);
    return fin(200, { enviado: r.ok });
  } catch (e) { console.log('[aviso] error al enviar:', e.message); return fin(200, { enviado: false, motivo: 'error' }); }
});

servidor.listen(PUERTO, '127.0.0.1', () => console.log(`[aviso] escuchando en 127.0.0.1:${PUERTO} · modo: ${modo()}`));
