import React, { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button, Card, Input } from './ui';
import { obtenerReferidos, type EstadoReferidos } from '../utils/promocionApi';
import { copyToClipboard } from '../utils/shareUtils';

/**
 * «Invita a otra banda»: el enlace propio de la banda y cuántas se han dado de alta con él. De las
 * invitadas solo se ve el NÚMERO (nunca quiénes son: AGENTS.md §2.1). Si el servidor no responde,
 * no se pinta nada: es un extra, no puede estorbar en el perfil.
 */
export function InvitarBandaCard() {
  const [estado, setEstado] = useState<EstadoReferidos | null>(null);
  const [copiado, setCopiado] = useState<'si' | 'no' | null>(null);

  useEffect(() => {
    let vivo = true;
    obtenerReferidos()
      .then((e) => vivo && setEstado(e))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);

  if (!estado) return null;

  const copiar = async () => {
    setCopiado((await copyToClipboard(estado.url)) ? 'si' : 'no');
    setTimeout(() => setCopiado(null), 2500);
  };

  return (
    <Card tone="sunken" radius="m" padding="sm" className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold">Invita a otra banda</h4>
        <span className="text-xs text-[var(--ink-2)] tabular-nums" aria-live="polite">
          {estado.invitadas === 0 ? 'Aún ninguna' : `${estado.invitadas} ${estado.invitadas === 1 ? 'banda invitada' : 'bandas invitadas'}`}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Input readOnly aria-label="Tu enlace de invitación" value={estado.url} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 text-xs" />
        <Button size="sm" variant={copiado === 'si' ? 'soft' : 'neutral'} onClick={() => void copiar()}>
          {copiado === 'si' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copiado === 'si' ? 'Copiado' : copiado === 'no' ? 'Selecciona y copia' : 'Copiar'}
        </Button>
      </div>
    </Card>
  );
}
