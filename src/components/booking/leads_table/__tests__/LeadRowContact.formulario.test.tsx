// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { Lead } from '../../../../types';

vi.mock('../LeadsTableContext', () => ({ useLeadsTable: () => ({ emailValidities: {} }), useLeadsTableContext: () => ({ emailValidities: {} }) }));

import { LeadRowContact } from '../LeadRowContact';

const montar = (lead: Partial<Lead>) =>
  render(
    <table>
      <tbody>
        <tr>
          <LeadRowContact lead={{ id: 'l1', notas: '', ...lead } as Lead} hasMovil={false} hasFijo={false} rawMovil="" rawFijo="" />
        </tr>
      </tbody>
    </table>,
  );

afterEach(cleanup);

describe('LeadRowContact: contacto por formulario', () => {
  it('sin email y con formulario, enseña el enlace en lugar de «Sin email»', () => {
    montar({ email_contacto: '', notas: 'Formulario de contacto: https://piratafestival.com/es/contacto/formulario' });
    const enlace = screen.getByRole('link', { name: /formulario/i });
    expect(enlace.getAttribute('href')).toBe('https://piratafestival.com/es/contacto/formulario');
    expect(enlace.getAttribute('target')).toBe('_blank');
    expect(enlace.getAttribute('rel')).toContain('noopener');
    expect(screen.queryByText('Sin email')).toBeNull();
  });
  it('sin email ni formulario, sigue diciendo «Sin email»', () => {
    montar({ email_contacto: '', notas: '' });
    expect(screen.getByText('Sin email')).toBeTruthy();
  });
  it('con email, no enseña el formulario aunque exista', () => {
    montar({ email_contacto: 'info@sala.es', notas: 'Formulario de contacto: https://a.es/f' });
    expect(screen.queryByRole('link', { name: /formulario/i })).toBeNull();
  });
});
