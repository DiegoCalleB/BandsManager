/**
 * Los textos que escribe un usuario (nombre de banda, firmante, miembro...) no pueden inyectar HTML
 * en los correos con la marca de la plataforma.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const enviados: any[] = [];
vi.mock('resend', () => ({
  Resend: class {
    emails = {
      send: async (m: any) => {
        enviados.push(m);
        return { data: { id: 'id-1' }, error: null };
      },
    };
  },
}));

process.env.RESEND_API_KEY = 're_test_clave_1234567890abcdef';

import { sendDealSignedToBandEmail, sendDealSignedToVenueEmail, sendMemberInvitationEmail, sendWelcomeEmail } from '../transactionalEmail';

const ataque = '<a href="https://phishing.example">Pulsa aquí</a>';

beforeEach(() => {
  enviados.length = 0;
});

describe('correos con textos de usuario', () => {
  it('bienvenida: el nombre de banda y de usuario salen escapados en el HTML y en claro en el asunto', async () => {
    await sendWelcomeEmail('a@x.com', 'Ana & Co', ataque);
    const m = enviados[0];
    expect(m.html).not.toContain(ataque);
    expect(m.html).toContain('&lt;a href=&quot;https://phishing.example&quot;&gt;');
    expect(m.subject).toContain('Ana & Co');
  });

  it('invitación de miembro', async () => {
    await sendMemberInvitationEmail({ toEmail: 'm@x.com', memberName: ataque, bandName: ataque, instrument: ataque, username: 'x' });
    const m = enviados[0];
    expect(m.to).toBe('m@x.com');
    expect(m.html).not.toContain(ataque);
    expect(m.subject).toContain(ataque); // el asunto es texto plano
  });

  it('acuerdo firmado (sala y banda): firmante, sala y banda escapados', async () => {
    const comunes = { toEmail: 'a@x.com', signerName: ataque, signerRole: ataque, venueName: ataque, bandName: ataque, eventDate: '2026-11-15', totalAgreed: 600, paymentMethod: 'efectivo', token: 'dl_abc123' };
    await sendDealSignedToVenueEmail(comunes as any);
    await sendDealSignedToBandEmail({ ...comunes, city: ataque } as any);
    for (const m of enviados) {
      expect(m.html).not.toContain(ataque);
      expect(m.html).toContain('&lt;a href=');
    }
  });
});
