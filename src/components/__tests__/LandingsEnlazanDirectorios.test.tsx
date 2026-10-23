// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { LanguageProvider } from '../../context/LanguageContext';
import { PublicLanding } from '../PublicLanding';
import { PublicTfmLanding } from '../PublicTfmLanding';

vi.mock('../LandingChatWidget', () => ({ LandingChatWidget: () => null }));

const enlacesA = (contenedor: HTMLElement, ruta: string) => [...contenedor.querySelectorAll('a')].filter((a) => a.getAttribute('href') === ruta);

describe.each([
  ['es', '/directories'],
  ['en', '/en/directories'],
] as const)('las dos landing enlazan los directorios públicos de salas y festivales (%s)', (idioma, ruta) => {
  beforeEach(() => {
    cleanup();
    localStorage.setItem('bandmanager_language', idioma);
  });

  it('la landing oficial, en el menú y en el pie', () => {
    const { container } = render(<LanguageProvider><PublicLanding onEntrar={() => {}} /></LanguageProvider>);
    expect(enlacesA(container, ruta).length).toBeGreaterThanOrEqual(2);
  });

  it('la landing del TFM, en el menú y en el pie', () => {
    const { container } = render(<LanguageProvider><PublicTfmLanding onEntrar={() => {}} /></LanguageProvider>);
    expect(enlacesA(container, ruta).length).toBeGreaterThanOrEqual(2);
  });
});
