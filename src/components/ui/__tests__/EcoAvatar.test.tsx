/**
 * EcoAvatar: la cara de Eco que sustituye al icono del agente de IA. Invariantes:
 *  · usa la imagen propia de la app (public/eco-avatar.webp) y es decorativa (sin texto alternativo);
 *  · el tamaño lo decide quien la usa, con un valor por defecto de icono pequeño.
 */
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EcoAvatar } from '..';

describe('EcoAvatar', () => {
  it('apunta a una imagen que existe y es decorativa', () => {
    const out = renderToStaticMarkup(<EcoAvatar />);
    expect(out).toContain('src="/eco-avatar.webp"');
    expect(out).toContain('alt=""');
    expect(out).toContain('aria-hidden="true"');
    expect(existsSync(resolve(process.cwd(), 'public/eco-avatar.webp'))).toBe(true);
  });

  it('acepta el tamaño desde fuera y conserva uno por defecto', () => {
    expect(renderToStaticMarkup(<EcoAvatar />)).toContain('size-5');
    expect(renderToStaticMarkup(<EcoAvatar className="size-8" />)).toContain('size-8');
  });
});
