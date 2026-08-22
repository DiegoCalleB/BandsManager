import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateContentWithFallback, callDeepSeek, TIMEOUT_IA_MS } from '../ai';

/**
 * Lo que se prueba aquí es el cambio de contrato: cuando se agotan todos los proveedores,
 * generateContentWithFallback LANZA en vez de devolver un pitch de booking en español
 * disfrazado de respuesta del modelo. Ese comportamiento silencioso llegaba a rutas que pedían
 * acordes, clasificaciones de la bandeja o JSON de emails.
 */

// Cliente falso cuyo modelo siempre falla, para forzar el final de la cadena.
const clienteQueSiempreFalla: any = {
  models: {
    generateContent: vi.fn().mockRejectedValue(new Error('429 RESOURCE_EXHAUSTED')),
  },
};

const clavesOriginales = {
  gemini: process.env.GEMINI_API_KEY,
  deepseek: process.env.DEEPSEEK_API_KEY,
  deepseek2: process.env.DEEPSEEK_KEY,
  anthropic: process.env.ANTHROPIC_API_KEY,
  claude: process.env.CLAUDE_API_KEY,
};

beforeEach(() => {
  // Sin claves de respaldo: la cadena tiene que llegar al final.
  delete process.env.DEEPSEEK_API_KEY;
  delete process.env.DEEPSEEK_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.CLAUDE_API_KEY;
  clienteQueSiempreFalla.models.generateContent.mockClear();
});

afterEach(() => {
  for (const [clave, valor] of Object.entries({
    GEMINI_API_KEY: clavesOriginales.gemini,
    DEEPSEEK_API_KEY: clavesOriginales.deepseek,
    DEEPSEEK_KEY: clavesOriginales.deepseek2,
    ANTHROPIC_API_KEY: clavesOriginales.anthropic,
    CLAUDE_API_KEY: clavesOriginales.claude,
  })) {
    if (valor === undefined) delete (process.env as any)[clave];
    else (process.env as any)[clave] = valor;
  }
  vi.unstubAllGlobals();
});

describe('generateContentWithFallback: el generador local es opt-in', () => {
  it('LANZA cuando se agotan los proveedores y no se ha pedido el generador local', async () => {
    await expect(
      generateContentWithFallback(clienteQueSiempreFalla, { contents: 'dame los acordes de esta canción' })
    ).rejects.toThrow();
  });

  it('nunca devuelve un pitch de booking a quien no lo pidió', async () => {
    // El fallo concreto que motivó el cambio: pedir un JSON y recibir un email de booking.
    let resultado: any = null;
    try {
      resultado = await generateContentWithFallback(clienteQueSiempreFalla, {
        contents: 'Extrae los emails de contacto y devuelve JSON',
        config: { responseMimeType: 'application/json' },
      });
    } catch {
      resultado = null;
    }
    expect(resultado).toBeNull();
  });

  it('SÍ devuelve el borrador local cuando la ruta lo pide explícitamente', async () => {
    const res: any = await generateContentWithFallback(clienteQueSiempreFalla, {
      contents: 'Escribe un pitch para la SALA: Sala Caracol',
      permitirPitchLocal: true,
    });
    expect(typeof res?.text).toBe('string');
    expect(res.text.length).toBeGreaterThan(0);
    // Y mantiene la forma que esperan los consumidores (candidates[].content.parts[].text).
    expect(res.candidates?.[0]?.content?.parts?.[0]?.text).toBe(res.text);
  });

  it('prueba todos los modelos de la lista antes de rendirse', async () => {
    await expect(
      generateContentWithFallback(clienteQueSiempreFalla, { contents: 'hola' })
    ).rejects.toThrow();
    expect(clienteQueSiempreFalla.models.generateContent.mock.calls.length).toBeGreaterThan(1);
  });

  it('pasa un abortSignal al SDK para que la petición no se cuelgue indefinidamente', async () => {
    await expect(
      generateContentWithFallback(clienteQueSiempreFalla, { contents: 'hola' })
    ).rejects.toThrow();
    const primeraLlamada = clienteQueSiempreFalla.models.generateContent.mock.calls[0][0];
    expect(primeraLlamada.config?.abortSignal).toBeInstanceOf(AbortSignal);
  });
});

describe('timeouts en los proveedores por HTTP', () => {
  it('callDeepSeek pasa un signal al fetch y aborta si no responde', async () => {
    process.env.DEEPSEEK_API_KEY = 'clave-de-prueba-suficientemente-larga';

    // fetch que no responde nunca, pero respeta el signal (como el fetch real).
    const fetchColgado = vi.fn((_url: any, opciones: any) =>
      new Promise((_resolver, rechazar) => {
        opciones?.signal?.addEventListener('abort', () =>
          rechazar(Object.assign(new Error('The operation was aborted'), { name: 'AbortError' }))
        );
      })
    );
    vi.stubGlobal('fetch', fetchColgado);

    await expect(
      callDeepSeek({ prompt: 'hola', timeoutMs: 30 })
    ).rejects.toThrow(/abort/i);

    expect(fetchColgado).toHaveBeenCalledTimes(1);
    expect(fetchColgado.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });

  it('el timeout por defecto es un valor finito y razonable', () => {
    expect(Number.isFinite(TIMEOUT_IA_MS)).toBe(true);
    expect(TIMEOUT_IA_MS).toBeGreaterThan(0);
  });
});
