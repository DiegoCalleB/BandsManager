/** Landing del TFM: cabecera corta, precios a un clic y alta de interesados sin registrarse. */
import { describe, expect, it } from 'vitest';
import fuente from '../PublicTfmLanding.tsx?raw';

describe('PublicTfmLanding', () => {
  it('el menú superior tiene solo tres enlaces, y uno es Precios', () => {
    const nav = fuente.slice(fuente.indexOf('<nav aria-label="Secciones"'), fuente.indexOf('</nav>'));
    expect(nav.match(/<a href=/g)).toHaveLength(3);
    expect(nav).toContain('href="#planes"');
  });

  it('deja el correo sin registrarse en la app (lista de espera con doble confirmación)', () => {
    expect(fuente).toContain('<FormularioInteres es={es} />');
  });
});
