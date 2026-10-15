import { describe, expect, it } from 'vitest';
import { hostEsDeDominio } from '../hostUrl';

const D = ['googleusercontent.com', 'clearbit.com'];

describe('hostEsDeDominio', () => {
  it('reconoce el dominio y sus subdominios, con o sin esquema', () => {
    expect(hostEsDeDominio('https://logo.clearbit.com/foo.png', D)).toBe(true);
    expect(hostEsDeDominio('https://lh3.googleusercontent.com/a=s96', D)).toBe(true);
    expect(hostEsDeDominio('clearbit.com/x', D)).toBe(true);
    expect(hostEsDeDominio('HTTPS://LOGO.CLEARBIT.COM/x', D)).toBe(true);
  });

  it('no se deja engañar por el dominio en otra parte de la URL', () => {
    expect(hostEsDeDominio('https://evil.com/?u=clearbit.com', D)).toBe(false);
    expect(hostEsDeDominio('https://clearbit.com.evil.com/x.png', D)).toBe(false);
    expect(hostEsDeDominio('https://evil.com/googleusercontent.com/x.png', D)).toBe(false);
    expect(hostEsDeDominio('https://notclearbit.com/x.png', D)).toBe(false);
    expect(hostEsDeDominio('https://clearbit.com@evil.com/x.png', D)).toBe(false);
  });

  it('devuelve false si no es una URL parseable', () => {
    expect(hostEsDeDominio('', D)).toBe(false);
    expect(hostEsDeDominio('http://', D)).toBe(false);
  });
});
