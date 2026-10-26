// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { LanguageProvider } from '../../context/LanguageContext';
import { PublicLanding } from '../PublicLanding';
import { PublicTfmLanding } from '../PublicTfmLanding';

vi.mock('../LandingChatWidget', () => ({ LandingChatWidget: () => null }));

const enlacesA = (contenedor: HTMLElement, ruta: string) => [...contenedor.querySelectorAll('a')].filter((a) => a.getAttribute('href') === ruta);

const landings = [
  ['oficial', () => <PublicLanding onEntrar={() => {}} />],
  ['del TFM', () => <PublicTfmLanding onEntrar={() => {}} />],
] as const;

describe.each([
  ['es', '', '/guides', '/directories'],
  ['en', '/en', '/en/guides', '/en/directories'],
] as const)('las dos landing enlazan guías y listados públicos de salas y festivales (%s)', (idioma, base, guias, directorios) => {
  beforeEach(() => {
    cleanup();
    localStorage.setItem('bandmanager_language', idioma);
  });

  describe.each(landings)('landing %s', (_nombre, pagina) => {
    it('los listados: menú, bloque propio con salas y festivales, y pie', () => {
      const { container } = render(<LanguageProvider>{pagina()}</LanguageProvider>);
      expect(enlacesA(container, directorios).length).toBeGreaterThanOrEqual(3);
      expect(enlacesA(container, `${base}/directories/venues`)).toHaveLength(1);
      expect(enlacesA(container, `${base}/directories/festivals`)).toHaveLength(1);
    });

    it('las guías: menú, bloque propio y pie', () => {
      const { container } = render(<LanguageProvider>{pagina()}</LanguageProvider>);
      expect(enlacesA(container, guias).length).toBeGreaterThanOrEqual(3);
    });
  });
});
