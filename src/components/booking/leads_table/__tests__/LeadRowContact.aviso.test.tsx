// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { Lead } from '../../../../types';

vi.mock('../LeadsTableContext', () => ({ useLeadsTable: () => ({ emailValidities: {} }), useLeadsTableContext: () => ({ emailValidities: {} }) }));

import { LeadRowContact } from '../LeadRowContact';
import { TEXTO_AVISO_EMAIL } from '../../../../utils/avisoDeEmail';

const conAviso = (email: string, para = email) =>
  ({
    id: 'l1',
    email_contacto: email,
    notas: '',
    datos_fuentes: { email_contacto: { fuente: 'ia', confianza: 'baja', en: '2026-10-18T12:00:00Z', aviso: { tipo: 'dominio_inexistente', para } } },
  }) as unknown as Lead;

const montar = (lead: Lead) =>
  render(
    <table>
      <tbody>
        <tr>
          <LeadRowContact lead={lead} hasMovil={false} hasFijo={false} rawMovil="" rawFijo="" />
        </tr>
      </tbody>
    </table>,
  );

afterEach(cleanup);

describe('LeadRowContact: aviso de email por confirmar', () => {
  it('muestra el aviso junto al email que quedó en duda', () => {
    montar(conAviso('info@dominio-raro.xyz'));
    expect(screen.getByRole('img', { name: 'Comprueba este email' }).getAttribute('title')).toBe(TEXTO_AVISO_EMAIL);
  });

  it('no lo muestra si el email se ha editado después', () => {
    montar(conAviso('booking@sala.es', 'info@dominio-raro.xyz'));
    expect(screen.queryByRole('img', { name: 'Comprueba este email' })).toBeNull();
  });

  it('no lo muestra en un lead normal', () => {
    montar({ id: 'l2', email_contacto: 'info@sala.es', notas: '' } as unknown as Lead);
    expect(screen.queryByRole('img', { name: 'Comprueba este email' })).toBeNull();
  });
});
