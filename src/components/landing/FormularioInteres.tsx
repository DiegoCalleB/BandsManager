import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '../ui';
import { registrarEvento } from '../../utils/analitica';

interface Props {
  es: boolean;
}

type Estado = 'reposo' | 'enviando' | 'hecho' | 'error';

/** «Avísame»: deja el email sin registrarse en la app. Doble confirmación por correo en el servidor. */
export const FormularioInteres: React.FC<Props> = ({ es }) => {
  const [email, setEmail] = useState('');
  const [acepta, setAcepta] = useState(false);
  const [web, setWeb] = useState('');
  const [estado, setEstado] = useState<Estado>('reposo');
  const [mensajeError, setMensajeError] = useState('');

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEstado('enviando');
    try {
      const r = await fetch('/api/public/interesados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, consentimiento: acepta, idioma: es ? 'es' : 'en', web }),
      });
      if (!r.ok) {
        const datos = (await r.json().catch(() => ({}))) as { error?: string };
        setMensajeError(datos.error || (es ? 'No hemos podido apuntarte. Inténtalo de nuevo.' : 'We could not sign you up. Please try again.'));
        setEstado('error');
        return;
      }
      registrarEvento('Interesado Landing');
      setEstado('hecho');
    } catch (err) {
      console.warn('[Landing] alta de interesado fallida:', err);
      setMensajeError(es ? 'Sin conexión. Inténtalo de nuevo.' : 'No connection. Please try again.');
      setEstado('error');
    }
  };

  if (estado === 'hecho') {
    return (
      <p role="status" className="mx-auto mt-10 max-w-md rounded-[var(--r-l)] bg-[var(--surface)] p-5 text-sm text-[var(--ink)]">
        {es
          ? 'Revisa tu correo: te hemos enviado un enlace para confirmar tu email. Sin ese clic no te escribimos.'
          : 'Check your inbox: we sent you a link to confirm your email. Until you click it we will not write to you.'}
      </p>
    );
  }

  return (
    <form onSubmit={enviar} className="mx-auto mt-10 max-w-md text-left" aria-label={es ? 'Recibir novedades' : 'Get updates'}>
      <p className="mb-3 text-center text-sm font-semibold text-[var(--ink)]">
        {es ? '¿Aún no te decides? Te avisamos de las novedades.' : 'Not ready yet? We will keep you posted.'}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="interes-email">Email</label>
        <input
          id="interes-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          placeholder={es ? 'tu@email.com' : 'you@email.com'}
          className="h-11 min-w-0 flex-1 rounded-[var(--r-pill)] bg-[var(--surface)] px-4 text-sm text-[var(--ink)] placeholder:text-[var(--ink-2)] focus:outline-none"
        />
        <Button type="submit" variant="neutral" size="md" disabled={estado === 'enviando' || !acepta}>
          <Mail className="size-4" aria-hidden />
          {es ? 'Avísame' : 'Notify me'}
        </Button>
      </div>
      {/* Campo trampa para bots: oculto a personas y a lectores de pantalla. */}
      <input
        type="text"
        name="web"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        value={web}
        onChange={(ev) => setWeb(ev.target.value)}
        className="absolute -left-[9999px] size-0 opacity-0"
      />
      <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs text-[var(--ink-2)]">
        <input type="checkbox" checked={acepta} onChange={(ev) => setAcepta(ev.target.checked)} className="mt-0.5" />
        <span>
          {es
            ? 'Acepto recibir novedades de BandManager.io por email. Me puedo dar de baja cuando quiera.'
            : 'I agree to receive BandManager.io news by email. I can unsubscribe at any time.'}
        </span>
      </label>
      {estado === 'error' && (
        <p role="alert" className="mt-2 text-xs text-[var(--alert)]">{mensajeError}</p>
      )}
    </form>
  );
};

export default FormularioInteres;
