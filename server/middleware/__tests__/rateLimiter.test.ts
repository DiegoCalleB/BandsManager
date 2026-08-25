import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRateLimiter, createConcurrencyLimiter, _vaciarRateLimitStore } from '../rateLimiter';

function peticion(opciones: { ip?: string; userId?: string } = {}) {
  return {
    headers: opciones.ip ? { 'x-forwarded-for': opciones.ip } : {},
    ip: opciones.ip || '10.0.0.1',
    user: opciones.userId ? { id: opciones.userId } : undefined,
  } as any;
}

/** Respuesta mínima que registra el estado y permite disparar finish/close. */
function respuesta() {
  const oyentes: Record<string, Array<() => void>> = {};
  const res: any = {
    statusCode: 0,
    cuerpo: null as any,
    cabeceras: {} as Record<string, string>,
    setHeader(k: string, v: string) { res.cabeceras[k] = v; },
    status(c: number) { res.statusCode = c; return res; },
    json(b: any) { res.cuerpo = b; return res; },
    on(evento: string, cb: () => void) { (oyentes[evento] ||= []).push(cb); },
    emitir(evento: string) { (oyentes[evento] || []).forEach((cb) => cb()); },
  };
  return res;
}

beforeEach(() => {
  _vaciarRateLimitStore();
});

describe('createRateLimiter', () => {
  it('deja pasar hasta el máximo y corta después', () => {
    const limitador = createRateLimiter({ windowMs: 60_000, maxRequests: 3 });
    let pasadas = 0;
    const siguiente = () => { pasadas++; };

    for (let i = 0; i < 3; i++) limitador(peticion(), respuesta(), siguiente);
    expect(pasadas).toBe(3);

    const res = respuesta();
    limitador(peticion(), res, siguiente);
    expect(pasadas).toBe(3);
    expect(res.statusCode).toBe(429);
    expect(res.cuerpo.success).toBe(false);
  });

  it('indica cuánto hay que esperar', () => {
    const limitador = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });
    limitador(peticion(), respuesta(), () => {});
    const res = respuesta();
    limitador(peticion(), res, () => {});
    expect(res.cabeceras['Retry-After']).toBeTruthy();
    expect(Number(res.cuerpo.retryAfter)).toBeGreaterThan(0);
  });

  it('no mezcla el cupo de dos IPs distintas', () => {
    const limitador = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });
    let pasadas = 0;
    limitador(peticion({ ip: '1.1.1.1' }), respuesta(), () => pasadas++);
    limitador(peticion({ ip: '2.2.2.2' }), respuesta(), () => pasadas++);
    expect(pasadas).toBe(2);
  });

  it('con porUsuario, dos usuarios tras la misma IP no comparten cupo', () => {
    // Es el caso real de una banda entera conectada al wifi del local de ensayo.
    const limitador = createRateLimiter({ windowMs: 60_000, maxRequests: 1, porUsuario: true });
    let pasadas = 0;
    limitador(peticion({ ip: '5.5.5.5', userId: 'a' }), respuesta(), () => pasadas++);
    limitador(peticion({ ip: '5.5.5.5', userId: 'b' }), respuesta(), () => pasadas++);
    expect(pasadas).toBe(2);

    const res = respuesta();
    limitador(peticion({ ip: '5.5.5.5', userId: 'a' }), res, () => pasadas++);
    expect(res.statusCode).toBe(429);
  });

  it('cada limitador lleva su propio contador', () => {
    // Sin prefijo por limitador todos comparten número: gastar el cupo del análisis dejaba
    // sin cupo al renderizado, porque el mismo contador se comparaba con dos máximos.
    const analisis = createRateLimiter({ nombre: 'ia', windowMs: 60_000, maxRequests: 5, porUsuario: true });
    const render = createRateLimiter({ nombre: 'render', windowMs: 60_000, maxRequests: 2, porUsuario: true });
    const req = () => peticion({ ip: '9.9.9.9', userId: 'mismo' });

    for (let i = 0; i < 5; i++) analisis(req(), respuesta(), () => {});

    // El renderizado no ha gastado nada todavía: sus dos peticiones deben pasar.
    let pasadas = 0;
    render(req(), respuesta(), () => pasadas++);
    render(req(), respuesta(), () => pasadas++);
    expect(pasadas).toBe(2);
  });

  it('el cupo se renueva al pasar la ventana', () => {
    vi.useFakeTimers();
    try {
      const limitador = createRateLimiter({ windowMs: 1000, maxRequests: 1 });
      let pasadas = 0;
      limitador(peticion(), respuesta(), () => pasadas++);
      const bloqueada = respuesta();
      limitador(peticion(), bloqueada, () => pasadas++);
      expect(bloqueada.statusCode).toBe(429);

      vi.advanceTimersByTime(1500);
      limitador(peticion(), respuesta(), () => pasadas++);
      expect(pasadas).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('createConcurrencyLimiter', () => {
  it('deja pasar hasta el tope y rechaza el resto con 503', () => {
    // Diez peticiones en el mismo segundo pasan el límite por ventana: sin este tope
    // se lanzarían diez ffmpeg de 1080p a la vez.
    const limitador = createConcurrencyLimiter({ max: 2 });
    let pasadas = 0;
    limitador(peticion(), respuesta(), () => pasadas++);
    limitador(peticion(), respuesta(), () => pasadas++);
    expect(pasadas).toBe(2);

    const res = respuesta();
    limitador(peticion(), res, () => pasadas++);
    expect(pasadas).toBe(2);
    expect(res.statusCode).toBe(503);
  });

  it('libera el hueco cuando la respuesta termina', () => {
    const limitador = createConcurrencyLimiter({ max: 1 });
    let pasadas = 0;
    const primera = respuesta();
    limitador(peticion(), primera, () => pasadas++);

    const rechazada = respuesta();
    limitador(peticion(), rechazada, () => pasadas++);
    expect(rechazada.statusCode).toBe(503);

    primera.emitir('finish');
    limitador(peticion(), respuesta(), () => pasadas++);
    expect(pasadas).toBe(2);
  });

  it('libera el hueco si el cliente se va a mitad', () => {
    // Sin escuchar `close`, un usuario que cierra la pestaña dejaría el hueco pillado
    // para siempre y el servidor acabaría rechazándolo todo.
    const limitador = createConcurrencyLimiter({ max: 1 });
    let pasadas = 0;
    const primera = respuesta();
    limitador(peticion(), primera, () => pasadas++);
    primera.emitir('close');

    limitador(peticion(), respuesta(), () => pasadas++);
    expect(pasadas).toBe(2);
  });

  it('finish y close juntos no liberan el hueco dos veces', () => {
    // Express emite los dos en una petición normal: si contaran por separado, el contador
    // se iría a negativo y el tope dejaría de aplicarse.
    const limitador = createConcurrencyLimiter({ max: 1 });
    let pasadas = 0;
    const primera = respuesta();
    limitador(peticion(), primera, () => pasadas++);
    primera.emitir('finish');
    primera.emitir('close');

    limitador(peticion(), respuesta(), () => pasadas++);
    expect(pasadas).toBe(2);

    const res = respuesta();
    limitador(peticion(), res, () => pasadas++);
    expect(res.statusCode).toBe(503);
  });
});
