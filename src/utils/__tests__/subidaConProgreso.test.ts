import { describe, it, expect, vi, afterEach } from 'vitest';
import { enviarConProgreso, type ProgresoSubida } from '../subidaConProgreso';

/** XHR falso: dispara progreso, fin de subida y respuesta, como el real. */
class XhrFalso {
  static ultimo: XhrFalso;
  upload: { onprogress?: (e: unknown) => void; onload?: () => void } = {};
  onload?: () => void; onerror?: () => void; onabort?: () => void;
  status = 0; responseText = '';
  cabeceras: Record<string, string> = {};
  constructor() { XhrFalso.ultimo = this; }
  open() {}
  setRequestHeader(k: string, v: string) { this.cabeceras[k] = v; }
  send() {}
}

afterEach(() => vi.unstubAllGlobals());

describe('enviarConProgreso', () => {
  it('informa de la subida, del procesado en el servidor y devuelve la respuesta', async () => {
    vi.stubGlobal('XMLHttpRequest', XhrFalso);
    const eventos: ProgresoSubida[] = [];
    const promesa = enviarConProgreso('/api/upload', { 'x-band-id': 'b1' }, new FormData(), (p) => eventos.push(p));
    const x = XhrFalso.ultimo;
    x.upload.onprogress?.({ lengthComputable: true, loaded: 50, total: 100 });
    x.upload.onprogress?.({ lengthComputable: true, loaded: 100, total: 100 });
    x.upload.onload?.();
    x.status = 200; x.responseText = JSON.stringify({ url: 'https://x/a.mp3' });
    x.onload?.();
    await expect(promesa).resolves.toEqual({ status: 200, datos: { url: 'https://x/a.mp3' } });
    expect(eventos).toEqual([
      { fase: 'subiendo', pct: 50 },
      { fase: 'subiendo', pct: 99 }, // nunca 100 % mientras sigue subiendo
      { fase: 'procesando', pct: 100 },
    ]);
    expect(x.cabeceras['x-band-id']).toBe('b1');
  });

  it('una respuesta que no es JSON (página de error del proxy) no rompe: datos = null', async () => {
    vi.stubGlobal('XMLHttpRequest', XhrFalso);
    const promesa = enviarConProgreso('/api/upload', {}, new FormData());
    const x = XhrFalso.ultimo;
    x.status = 502; x.responseText = '<html>Bad gateway</html>';
    x.onload?.();
    await expect(promesa).resolves.toEqual({ status: 502, datos: null });
  });

  it('rechaza si se corta la conexión', async () => {
    vi.stubGlobal('XMLHttpRequest', XhrFalso);
    const promesa = enviarConProgreso('/api/upload', {}, new FormData());
    XhrFalso.ultimo.onerror?.();
    await expect(promesa).rejects.toThrow(/conexión/);
  });
});
