import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '../ui';
import { copyToClipboard } from '../../utils/shareUtils';

/** Copia un texto al portapapeles y lo confirma un instante. */
export function BotonCopiar({ texto, etiqueta = 'Copiar' }: { texto: string; etiqueta?: string }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    if (await copyToClipboard(texto)) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    }
  };
  return (
    <Button size="xs" variant="ghost" onClick={copiar} aria-label={etiqueta === 'Copiar' ? undefined : `${etiqueta}: ${texto.slice(0, 40)}`}>
      {copiado ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      {copiado ? 'Copiado' : etiqueta}
    </Button>
  );
}
