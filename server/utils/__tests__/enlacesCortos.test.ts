import { describe, expect, it } from 'vitest';
import {
  claveEnlace,
  conUtm,
  dispositivoDe,
  esBot,
  esCanal,
  esDestino,
  generarCodigo,
  hashVisitante,
  LONGITUD_CODIGO,
  normalizarCodigo,
  origenDe,
  resolverDestino,
  resumirClics,
  urlHttpSegura,
  type ContextoDestino,
} from '../enlacesCortos';

const ctx: ContextoDestino = {
  baseUrl: 'https://bandmanager.io/',
  bandToken: 't_abc',
  entradasUrl: 'https://www.ticketmaster.es/event/123',
  conciertoUrl: 'https://bandmanager.io/e/banda-sala-2026-10-16--cnc-1',
  concertId: 'cnc-1',
};

describe('códigos', () => {
  it('genera códigos del largo y alfabeto esperados, y normalizables', () => {
    for (let i = 0; i < 200; i++) {
      const c = generarCodigo();
      expect(c).toHaveLength(LONGITUD_CODIGO);
      expect(normalizarCodigo(c)).toBe(c);
    }
  });

  it('no repite códigos en una muestra grande (aleatorio, no secuencial)', () => {
    const vistos = new Set(Array.from({ length: 5000 }, generarCodigo));
    expect(vistos.size).toBe(5000);
  });

  it('rechaza lo que no es un código nuestro', () => {
    for (const malo of ['', 'abc', 'ABCDEFGH', '0000000', 'abcde<>', "abcdef'", '../../x', undefined, null, 42, 'a b c d e']) {
      expect(normalizarCodigo(malo)).toBeNull();
    }
  });

  it('acepta mayúsculas (se normalizan) y espacios alrededor', () => {
    const c = generarCodigo();
    expect(normalizarCodigo(` ${c.toUpperCase()} `)).toBe(c);
  });

  it('valida destinos y canales cerrados', () => {
    expect(esDestino('entradas')).toBe(true);
    expect(esDestino('https://evil.com')).toBe(false);
    expect(esCanal('instagram')).toBe(true);
    expect(esCanal('__proto__')).toBe(false);
  });

  it('la clave distingue concierto, destino y canal', () => {
    expect(claveEnlace('c1', 'entradas', 'instagram')).not.toBe(claveEnlace('c1', 'entradas', 'tiktok'));
    expect(claveEnlace('c1', 'entradas', 'instagram')).not.toBe(claveEnlace('c2', 'entradas', 'instagram'));
    expect(claveEnlace(null, 'epk', 'web')).toBe('-|epk|web');
  });
});

describe('urlHttpSegura', () => {
  it('solo acepta http(s) sin credenciales', () => {
    expect(urlHttpSegura('https://a.com/x?y=1')).toBe('https://a.com/x?y=1');
    expect(urlHttpSegura('http://a.com')).toBe('http://a.com/');
    for (const malo of ['javascript:alert(1)', 'data:text/html,hi', 'ftp://a.com', '//a.com', 'a.com', '', '   ', null, undefined, 'https://user:pw@a.com', 'https://']) {
      expect(urlHttpSegura(malo as any)).toBeNull();
    }
  });
});

describe('resolverDestino', () => {
  it('entradas: va directo a la URL externa y NO le toca los parámetros', () => {
    const r = resolverDestino({ destino: 'entradas', canal: 'instagram', concert_id: 'cnc-1' }, ctx);
    expect(r).toEqual({ url: 'https://www.ticketmaster.es/event/123', destinoEfectivo: 'entradas' });
  });

  it('entradas sin enlace válido: degrada a la página del concierto con UTM, nunca a 404', () => {
    for (const entradasUrl of [null, undefined, '', 'javascript:alert(1)']) {
      const r = resolverDestino({ destino: 'entradas', canal: 'tiktok', concert_id: 'cnc-1' }, { ...ctx, entradasUrl });
      expect(r.destinoEfectivo).toBe('concierto');
      const u = new URL(r.url);
      expect(u.origin + u.pathname).toBe('https://bandmanager.io/e/banda-sala-2026-10-16--cnc-1');
      expect(u.searchParams.get('utm_source')).toBe('tiktok');
      expect(u.searchParams.get('utm_campaign')).toBe('cnc-1');
    }
  });

  it('sin página de concierto ni entradas: acaba en el dossier de la banda', () => {
    const r = resolverDestino({ destino: 'entradas', canal: 'web', concert_id: 'x' }, { ...ctx, entradasUrl: null, conciertoUrl: null });
    expect(r.destinoEfectivo).toBe('epk');
    expect(r.url.startsWith('https://bandmanager.io/epk?b=t_abc')).toBe(true);
  });

  it('el destino de otro dominio NUNCA sale de la URL del concierto/entradas de la propia banda', () => {
    // Una URL externa solo puede venir de entradasUrl; fans/epk/concierto siempre son del dominio propio.
    for (const destino of ['concierto', 'epk', 'fans'] as const) {
      const r = resolverDestino({ destino, canal: 'otro', concert_id: 'cnc-1' }, ctx);
      expect(new URL(r.url).origin).toBe('https://bandmanager.io');
    }
  });

  it('fans lleva el concierto de origen', () => {
    const r = resolverDestino({ destino: 'fans', canal: 'whatsapp', concert_id: 'cnc-1' }, ctx);
    const u = new URL(r.url);
    expect(u.pathname).toBe('/unete');
    expect(u.searchParams.get('b')).toBe('t_abc');
    expect(u.searchParams.get('concertId')).toBe('cnc-1');
  });

  it('conUtm conserva la URL si no se puede parsear', () => {
    expect(conUtm('no es url', 'x', 'y')).toBe('no es url');
  });
});

describe('bots y dispositivos', () => {
  it('no cuenta rastreadores ni vistas previas', () => {
    for (const ua of [
      'WhatsApp/2.23.20.0 A',
      'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'TelegramBot (like TwitterBot)',
      'Slackbot-LinkExpanding 1.0',
      'Twitterbot/1.0',
      'curl/8.4.0',
      'python-requests/2.31',
      '',
    ]) {
      expect(esBot(ua)).toBe(true);
    }
    expect(esBot(undefined)).toBe(true);
  });

  it('sí cuenta navegadores de persona', () => {
    for (const ua of [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ]) {
      expect(esBot(ua)).toBe(false);
    }
  });

  it('clasifica el dispositivo', () => {
    expect(dispositivoDe('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148')).toBe('movil');
    expect(dispositivoDe('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)')).toBe('tablet');
    expect(dispositivoDe('Mozilla/5.0 (Linux; Android 13; SM-X700) Safari/537.36')).toBe('tablet');
    expect(dispositivoDe('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120')).toBe('escritorio');
  });
});

describe('hash de visitante y origen', () => {
  it('es estable en el día, cambia de un día a otro y no contiene la IP', () => {
    const a = hashVisitante('1.2.3.4', 'UA', '2026-10-16', 'secreto');
    expect(a).toBe(hashVisitante('1.2.3.4', 'UA', '2026-10-16', 'secreto'));
    expect(a).not.toBe(hashVisitante('1.2.3.4', 'UA', '2026-10-17', 'secreto'));
    expect(a).not.toBe(hashVisitante('1.2.3.5', 'UA', '2026-10-16', 'secreto'));
    expect(a).not.toBe(hashVisitante('1.2.3.4', 'UA', '2026-10-16', 'otro'));
    expect(a).toHaveLength(16);
    expect(a).not.toContain('1.2.3.4');
  });

  it('del Referer solo guarda el host', () => {
    expect(origenDe('https://www.instagram.com/stories/abc?token=SECRETO')).toBe('instagram.com');
    expect(origenDe('https://l.instagram.com/?u=x')).toBe('l.instagram.com');
    expect(origenDe('no-es-url')).toBeNull();
    expect(origenDe(undefined)).toBeNull();
    expect(origenDe('')).toBeNull();
  });
});

describe('resumirClics', () => {
  const ahora = new Date('2026-10-16T12:00:00Z');
  const enlaces = [
    { code: 'aaaaaaa', canal: 'instagram', destino: 'entradas' as const, concert_id: 'c1' },
    { code: 'bbbbbbb', canal: 'tiktok', destino: 'entradas' as const, concert_id: 'c1' },
    { code: 'ccccccc', canal: 'whatsapp', destino: 'epk' as const, concert_id: null },
  ];

  it('cuenta clics y personas por enlace y total', () => {
    const r = resumirClics(
      enlaces,
      [
        { code: 'aaaaaaa', clicked_at: '2026-10-16T10:00:00Z', visitante: 'v1' },
        { code: 'aaaaaaa', clicked_at: '2026-10-16T10:05:00Z', visitante: 'v1' },
        { code: 'aaaaaaa', clicked_at: '2026-10-15T10:05:00Z', visitante: 'v2' },
        { code: 'bbbbbbb', clicked_at: '2026-10-16T09:00:00Z', visitante: 'v1' },
      ],
      ahora
    );
    expect(r.porEnlace.aaaaaaa.clics).toBe(3);
    expect(r.porEnlace.aaaaaaa.personas).toBe(2);
    expect(r.porEnlace.bbbbbbb.clics).toBe(1);
    expect(r.porEnlace.ccccccc.clics).toBe(0);
    expect(r.totales.clics).toBe(4);
    // v1 hizo clic en dos enlaces: es una persona, no dos.
    expect(r.totales.personas).toBe(2);
    expect(r.porCanal).toEqual([
      { canal: 'instagram', clics: 3 },
      { canal: 'tiktok', clics: 1 },
    ]);
  });

  it('reparte por día en los últimos 7 (el último es hoy)', () => {
    const r = resumirClics(
      enlaces,
      [
        { code: 'aaaaaaa', clicked_at: '2026-10-16T10:00:00Z' },
        { code: 'aaaaaaa', clicked_at: '2026-10-15T10:00:00Z' },
        { code: 'aaaaaaa', clicked_at: '2026-10-10T10:00:00Z' },
        // Hace más de una semana: cuenta en el total pero no en la serie.
        { code: 'aaaaaaa', clicked_at: '2026-09-01T10:00:00Z' },
      ],
      ahora
    );
    expect(r.porEnlace.aaaaaaa.ultimos7).toEqual([1, 0, 0, 0, 0, 1, 1]);
    expect(r.porEnlace.aaaaaaa.clics).toBe(4);
    expect(r.totales.ultimos7).toEqual([1, 0, 0, 0, 0, 1, 1]);
    expect(r.porEnlace.aaaaaaa.ultimoClic).toBe('2026-10-16T10:00:00Z');
  });

  it('ignora clics de enlaces que ya no existen y fechas corruptas sin romperse', () => {
    const r = resumirClics(
      enlaces,
      [
        { code: 'zzzzzzz', clicked_at: '2026-10-16T10:00:00Z', visitante: 'v1' },
        { code: 'aaaaaaa', clicked_at: 'no-es-fecha', visitante: 'v2' },
      ],
      ahora
    );
    expect(r.totales.clics).toBe(1);
    expect(r.porEnlace.aaaaaaa.ultimos7).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  it('sin datos devuelve ceros, no undefined ni NaN', () => {
    const r = resumirClics([], [], ahora);
    expect(r.totales).toEqual({ clics: 0, personas: 0, ultimos7: [0, 0, 0, 0, 0, 0, 0] });
    expect(r.porCanal).toEqual([]);
  });

  it('«hoy» se mide en hora de Madrid: a las 23:30 UTC del 15 ya es día 16 en Madrid', () => {
    const r = resumirClics(enlaces, [{ code: 'aaaaaaa', clicked_at: '2026-10-15T23:30:00Z' }], new Date('2026-10-15T23:45:00Z'));
    expect(r.porEnlace.aaaaaaa.ultimos7[6]).toBe(1);
  });
});
