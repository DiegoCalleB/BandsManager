import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Este setup corre para TODOS los tests (lógica pura en 'node' y componentes en 'jsdom').
// cleanup() desmonta el árbol de React entre tests para que no se acumulen nodos duplicados
// en document.body; se guarda tras comprobar que `document` existe para no romper los tests
// de 'node' (server/, src/utils), que no tienen DOM.
afterEach(() => {
  if (typeof document !== 'undefined') {
    cleanup();
  }
});

// jsdom no implementa matchMedia ni ResizeObserver, y varios componentes/librerías de UI
// los llaman al montar. Sin este stub, cualquier test de componente que los use petaría
// con "matchMedia is not a function" aunque el componente en sí esté bien.
if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
  }

  if (!('ResizeObserver' in window)) {
    (window as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
}
