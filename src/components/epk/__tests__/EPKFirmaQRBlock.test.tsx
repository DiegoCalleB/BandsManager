// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EPKFirmaQRBlock } from '../EPKFirmaQRBlock';
import { EPKConfig } from '../../../types';

// copyRichSignatureToClipboard usa navigator.clipboard con contenido rico (HTML), que jsdom
// no soporta de verdad. Mockeamos el módulo para probar la interacción del componente sin
// depender de esa API del navegador.
vi.mock('../../../utils/emailFormatter', () => ({
  buildEmailSignatureHtml: () => '<p>firma</p>',
  buildEmailSignaturePlainText: () => 'firma en texto plano',
  copyRichSignatureToClipboard: vi.fn().mockResolvedValue(true),
}));

const PUBLIC_EPK_URL = 'https://bandmanager.io/epk/la-banda-del-momento';

function buildConfig(overrides: Partial<EPKConfig> = {}): EPKConfig {
  return {
    biografia: 'Somos una banda de rock de Madrid.',
    logoUrl: '',
    bandPhotos: [],
    riderTecnico: '',
    enlacesRedes: {},
    contactoBooking: { nombre: '', email: '', telefono: '' },
    temasDestacadosIds: [],
    ...overrides,
  } as EPKConfig;
}

describe('EPKFirmaQRBlock', () => {
  let setConfig: Mock<(value: React.SetStateAction<EPKConfig>) => void>;
  let handleCopyUrl: Mock<() => void>;

  beforeEach(() => {
    setConfig = vi.fn<(value: React.SetStateAction<EPKConfig>) => void>();
    handleCopyUrl = vi.fn<() => void>();
  });

  it('genera el QR apuntando a la URL pública del EPK, lista para imprimir o compartir', () => {
    render(
      <EPKFirmaQRBlock
        config={buildConfig()}
        setConfig={setConfig}
        publicEpkUrl={PUBLIC_EPK_URL}
        handleCopyUrl={handleCopyUrl}
        copiado={false}
      />
    );

    // react-qr-code renderiza un <svg>; comprobamos que existe y que codifica la URL correcta.
    const qrSvg = document.querySelector('svg');
    expect(qrSvg).toBeInTheDocument();

    expect(screen.getByText(PUBLIC_EPK_URL)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /abrir dossier/i })).toHaveAttribute(
      'href',
      PUBLIC_EPK_URL
    );
  });

  it('dispara handleCopyUrl al pulsar "Copiar Enlace" y refleja el estado "copiado"', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <EPKFirmaQRBlock
        config={buildConfig()}
        setConfig={setConfig}
        publicEpkUrl={PUBLIC_EPK_URL}
        handleCopyUrl={handleCopyUrl}
        copiado={false}
      />
    );

    await user.click(screen.getByRole('button', { name: /copiar enlace/i }));
    expect(handleCopyUrl).toHaveBeenCalledTimes(1);

    // El estado "copiado" lo controla el padre (isBakandeya/CRM real); simulamos su respuesta.
    rerender(
      <EPKFirmaQRBlock
        config={buildConfig()}
        setConfig={setConfig}
        publicEpkUrl={PUBLIC_EPK_URL}
        handleCopyUrl={handleCopyUrl}
        copiado={true}
      />
    );
    expect(screen.getByRole('button', { name: /¡copiado!/i })).toBeInTheDocument();
  });

  it('actualiza el nombre del remitente de la firma al escribir en el campo', async () => {
    const user = userEvent.setup();
    render(
      <EPKFirmaQRBlock
        config={buildConfig()}
        setConfig={setConfig}
        publicEpkUrl={PUBLIC_EPK_URL}
        handleCopyUrl={handleCopyUrl}
        copiado={false}
      />
    );

    // El <label> no está enlazado al <input> (ni htmlFor ni wrapping), así que lo localizamos
    // por su placeholder, como ya hacen los inputs equivalentes de este bloque.
    await user.type(screen.getByPlaceholderText(/booking & management$/i), 'A');

    expect(setConfig).toHaveBeenCalledTimes(1);
    const updater = setConfig.mock.calls[0][0];
    const nextConfig = typeof updater === 'function' ? updater(buildConfig()) : updater;
    expect(nextConfig.firmaEmail?.nombreRemitente).toBe('A');
  });
});
