import React, { useEffect, useState } from 'react';
import { Gift } from 'lucide-react';
import { Button, Input } from './ui';
import { apiFetch } from '../utils/api';

interface Estado {
  elegible: boolean;
  cantidad?: number;
  expres?: boolean;
  yaPedido?: boolean;
}

/**
 * Regalo de pegatinas de la primera suscripción de pago. Solo aparece si la banda activa tiene un plan de
 * pago con cobro activo; el servidor decide (aquí no se calcula nada).
 */
export const RegaloPegatinas: React.FC = () => {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [campos, setCampos] = useState({ nombre: '', direccion: '', cp: '', ciudad: '', pais: 'España', telefono: '' });
  const [acepta, setAcepta] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let vivo = true;
    apiFetch<Estado>('/api/billing/pegatinas')
      .then((e) => vivo && setEstado(e))
      .catch((err) => {
        // Sin regalo visible no pasa nada: la pantalla de planes funciona igual.
        console.warn('[Pegatinas] no se pudo comprobar el regalo:', err);
      });
    return () => {
      vivo = false;
    };
  }, []);

  if (!estado?.elegible) return null;

  const cambiar = (k: keyof typeof campos) => (e: React.ChangeEvent<HTMLInputElement>) => setCampos((c) => ({ ...c, [k]: e.target.value }));

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError('');
    try {
      await apiFetch('/api/billing/pegatinas', { method: 'POST', body: JSON.stringify({ ...campos, consentimiento: acepta }) });
      setEstado({ ...estado, yaPedido: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos registrar tu pedido.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="mx-auto my-6 max-w-2xl rounded-[var(--r-l)] bg-[var(--surface)] p-5 sm:p-6" aria-label="Regalo de pegatinas">
      <div className="flex items-center gap-2">
        <Gift className="size-5 text-[var(--acc-ink)]" aria-hidden />
        <h2 className="font-display text-lg font-bold">{estado.cantidad} pegatinas de tu banda, de regalo</h2>
      </div>
      {estado.yaPedido ? (
        <p role="status" className="mt-3 text-sm text-[var(--ink-2)]">
          Pack pedido. Te lo mandamos a la dirección que nos diste{estado.expres ? ', con envío exprés' : ''}.
        </p>
      ) : (
        <form onSubmit={enviar} className="mt-4 space-y-3">
          <p className="text-sm text-[var(--ink-2)]">
            Por tu primera suscripción{estado.expres ? ' y con envío exprés' : ''}. Dinos adónde mandarlas.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input required value={campos.nombre} onChange={cambiar('nombre')} maxLength={120} placeholder="Nombre de quien recibe" aria-label="Nombre" />
            <Input value={campos.telefono} onChange={cambiar('telefono')} maxLength={30} placeholder="Teléfono (opcional)" aria-label="Teléfono" />
          </div>
          <Input required value={campos.direccion} onChange={cambiar('direccion')} maxLength={200} placeholder="Dirección" aria-label="Dirección" />
          <div className="grid gap-3 sm:grid-cols-3">
            <Input required value={campos.cp} onChange={cambiar('cp')} maxLength={12} placeholder="Código postal" aria-label="Código postal" />
            <Input required value={campos.ciudad} onChange={cambiar('ciudad')} maxLength={80} placeholder="Ciudad" aria-label="Ciudad" />
            <Input value={campos.pais} onChange={cambiar('pais')} maxLength={60} placeholder="País" aria-label="País" />
          </div>
          <label className="flex cursor-pointer items-start gap-2 text-xs text-[var(--ink-2)]">
            <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} className="mt-0.5" />
            <span>Acepto que BandManager.io use estos datos solo para enviarme el pack.</span>
          </label>
          {error && <p role="alert" className="text-xs text-[var(--alert)]">{error}</p>}
          <Button type="submit" variant="primary" size="md" disabled={enviando || !acepta}>
            Pedir mis pegatinas
          </Button>
        </form>
      )}
    </section>
  );
};

export default RegaloPegatinas;
