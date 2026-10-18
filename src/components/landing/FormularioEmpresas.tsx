import React, { useState } from 'react';
import { Button, Input, Select, Textarea } from '../ui';

type Estado = 'reposo' | 'enviando' | 'hecho' | 'error';

/** Consulta de empresa para los planes B2B: se guarda en el servidor y avisa al equipo por email. */
export const FormularioEmpresas: React.FC<{ es: boolean }> = ({ es }) => {
  const [empresa, setEmpresa] = useState('');
  const [email, setEmail] = useState('');
  const [tipo, setTipo] = useState('agencia');
  const [mensaje, setMensaje] = useState('');
  const [acepta, setAcepta] = useState(false);
  const [web, setWeb] = useState('');
  const [estado, setEstado] = useState<Estado>('reposo');
  const [error, setError] = useState('');

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEstado('enviando');
    try {
      const r = await fetch('/api/public/contacto-empresas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa, email, tipo, mensaje, consentimiento: acepta, idioma: es ? 'es' : 'en', web }),
      });
      if (!r.ok) {
        const datos = (await r.json().catch(() => ({}))) as { error?: string };
        setError(datos.error || (es ? 'No hemos podido enviar tu consulta.' : 'We could not send your enquiry.'));
        setEstado('error');
        return;
      }
      setEstado('hecho');
    } catch (err) {
      console.warn('[Landing] consulta B2B fallida:', err);
      setError(es ? 'Sin conexión. Inténtalo de nuevo.' : 'No connection. Please try again.');
      setEstado('error');
    }
  };

  if (estado === 'hecho') {
    return (
      <p role="status" className="mx-auto mt-8 max-w-xl rounded-[var(--r-l)] bg-[var(--surface)] p-5 text-sm text-[var(--ink)]">
        {es ? 'Gracias. Hemos recibido tu consulta y te escribiremos pronto.' : 'Thank you. We received your enquiry and will get back to you soon.'}
      </p>
    );
  }

  return (
    <form onSubmit={enviar} className="mx-auto mt-8 max-w-xl space-y-3 rounded-[var(--r-l)] bg-[var(--surface)] p-5 text-left sm:p-6" aria-label={es ? 'Consulta para empresas' : 'Enquiry for companies'}>
      <p className="text-sm font-semibold">{es ? 'Hablemos de tu cartera' : 'Let us talk about your roster'}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input required value={empresa} onChange={(e) => setEmpresa(e.target.value)} maxLength={120} placeholder={es ? 'Empresa' : 'Company'} aria-label={es ? 'Empresa' : 'Company'} />
        <Input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@empresa.com" aria-label="Email" />
      </div>
      <Select value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label={es ? 'Tipo de empresa' : 'Type of company'}>
        <option value="agencia">{es ? 'Agencia o mánager' : 'Agency or manager'}</option>
        <option value="sello">{es ? 'Sello discográfico' : 'Record label'}</option>
        <option value="sala">{es ? 'Sala o festival' : 'Venue or festival'}</option>
        <option value="escuela">{es ? 'Escuela de música' : 'Music school'}</option>
        <option value="otro">{es ? 'Otro' : 'Other'}</option>
      </Select>
      <Textarea rows={3} value={mensaje} onChange={(e) => setMensaje(e.target.value)} maxLength={1000} placeholder={es ? 'Cuántas bandas gestionas y qué necesitas (opcional)' : 'How many bands you manage and what you need (optional)'} aria-label={es ? 'Mensaje' : 'Message'} />
      {/* Campo trampa para bots: oculto a personas y a lectores de pantalla. */}
      <input type="text" name="web" tabIndex={-1} autoComplete="off" aria-hidden value={web} onChange={(e) => setWeb(e.target.value)} className="absolute -left-[9999px] size-0 opacity-0" />
      <label className="flex cursor-pointer items-start gap-2 text-xs text-[var(--ink-2)]">
        <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} className="mt-0.5" />
        <span>{es ? 'Acepto que BandManager.io use estos datos para contestar a mi consulta.' : 'I agree BandManager.io may use this data to reply to my enquiry.'}</span>
      </label>
      {estado === 'error' && <p role="alert" className="text-xs text-[var(--alert)]">{error}</p>}
      <Button type="submit" variant="primary" size="md" disabled={estado === 'enviando' || !acepta}>
        {es ? 'Enviar consulta' : 'Send enquiry'}
      </Button>
    </form>
  );
};

export default FormularioEmpresas;
