import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button, Textarea } from '../ui';
import { BotonVoz } from './BotonVoz';
import { MAX_ORDEN_UI, type ResultadoOrden } from './hooks/useOrdenCartel';

const EJEMPLOS = ['Fecha grande y roja', 'Quita el logo', 'Cielo oscuro y sin nubes', 'Añade «Entrada libre» arriba'];

interface Props {
  ordenar: (orden: string) => Promise<boolean>;
  ordenando: boolean;
  resultado: ResultadoOrden | null;
  /** Hay un fondo de IA elegido: lo de la ilustración se puede retocar. */
  hayFondoIa: boolean;
}

/**
 * «Pídele cambios al cartel»: una frase para todo. Lo de las capas de BandManager (texto, QR, logo, datos) se
 * aplica como un cambio normal del editor (se puede deshacer); lo de la ilustración lo retoca la IA de imagen.
 */
export function OrdenCartel({ ordenar, ordenando, resultado, hayFondoIa }: Props) {
  const [orden, setOrden] = useState('');
  const enviar = async () => {
    if (orden.trim() && (await ordenar(orden))) setOrden('');
  };

  return (
    <section className="grid gap-2 rounded-[var(--r-m)] bg-[var(--sunken)] p-3" aria-label="Pídele cambios al cartel">
      <p className="text-xs font-medium text-[var(--ink-2)]">Pídele cambios al cartel</p>
      <div className="relative">
        <Textarea rows={2} maxLength={MAX_ORDEN_UI} value={orden} className="pr-10" aria-label="Qué quieres cambiar del cartel"
          placeholder="Ej.: pon la fecha más grande y roja, quita el logo y el cielo más oscuro"
          onChange={(e) => setOrden(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void enviar();
          }} />
        <BotonVoz valor={orden} maximo={MAX_ORDEN_UI} etiqueta="Dictar el cambio" onTexto={setOrden} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Ejemplos de cambio">
        {EJEMPLOS.map((e) => (
          <Button key={e} size="xs" variant="raised" onClick={() => setOrden(e)}>
            {e}
          </Button>
        ))}
      </div>
      <Button variant="soft" disabled={ordenando || !orden.trim()} onClick={() => void enviar()}>
        <Send className="size-4" aria-hidden />
        {ordenando ? 'Aplicando…' : 'Aplicar el cambio'}
      </Button>
      {resultado && (
        <p role="status" className="text-xs text-[var(--ink-2)] text-pretty">
          {resultado.resumen}
          {resultado.capas > 0 && ` · ${resultado.capas} ${resultado.capas === 1 ? 'cambio' : 'cambios'} en el cartel (puedes deshacerlo).`}
          {resultado.arte && ' · Fondo retocado con IA (1 imagen).'}
          {resultado.arteSinFondo && !hayFondoIa && ' · Lo de la ilustración necesita un fondo con IA: pídelo en «IA» y vuelve a probar.'}
        </p>
      )}
    </section>
  );
}
