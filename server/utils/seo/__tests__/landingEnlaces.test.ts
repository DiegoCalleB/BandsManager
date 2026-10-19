import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { guiaPorSlug } from '../indice.js';

const leer = (ruta: string) => fs.readFileSync(path.join(process.cwd(), ruta), 'utf8');

describe('enlaces de la landing a las guías', () => {
  const fuente = leer('src/components/landing/GuiasDestacadas.tsx');

  it('cada guía destacada existe en su idioma', () => {
    const es = [...fuente.matchAll(/'\/guides\/([a-z0-9-]+)'/g)].map((m) => m[1]);
    const en = [...fuente.matchAll(/'\/en\/guides\/([a-z0-9-]+)'/g)].map((m) => m[1]);
    expect(es.length).toBeGreaterThanOrEqual(3);
    expect(en).toHaveLength(es.length);
    for (const slug of es) expect(guiaPorSlug(slug, 'es'), `/guides/${slug} no existe`).not.toBeNull();
    for (const slug of en) expect(guiaPorSlug(slug, 'en'), `/en/guides/${slug} no existe`).not.toBeNull();
  });

  it('la landing enlaza el índice desde la barra, el bloque y el pie', () => {
    const landing = leer('src/components/PublicLanding.tsx');
    expect(landing).toContain("const guiasHref = es ? '/guides' : '/en/guides'");
    expect(landing.match(/href=\{guiasHref\}/g)!.length).toBeGreaterThanOrEqual(2);
    expect(landing).toContain('<GuiasDestacadas />');
    expect(fuente).toContain("'/guides'");
    expect(fuente).toContain("'/en/guides'");
  });
});
