import React, { useRef } from 'react';
import { Download, FileArchive, Share2 } from 'lucide-react';
import type { Concert } from '../../types';
import { ActionMenu, Button, EmptyState, Select, Tabs } from '../ui';
import { FORMATOS, ORDEN_FORMATOS, type FormatoCartel } from '../../utils/cartel/formatos';
import { fechaCartel } from '../../utils/cartel/texto';
import { useEditorCartel } from './hooks/useEditorCartel';
import { SelectorFondo } from './SelectorFondo';

interface Props {
  concerts: Concert[];
  bandName: string;
  /** Si se llega desde la ficha de un bolo, ese bolo ya viene elegido. */
  initialConcertId?: string;
}

const PESTANAS = ORDEN_FORMATOS.map((id) => ({ id, label: FORMATOS[id].etiqueta }));

/**
 * Cartelería: abrir y tener cartel. El próximo bolo viene elegido y el cartel sale al instante
 * sin IA (color + la Onda); la IA y la foto son extras. Tres bloques en móvil: bolo, cartel, acciones.
 */
const CarteleriaView: React.FC<Props> = ({ concerts, bandName, initialConcertId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ed = useEditorCartel({ canvasRef, concerts, bandName, initialConcertId });

  if (!ed.concierto) {
    return (
      <div data-modulo="reels" className="mx-auto max-w-3xl px-4 py-8">
        <EmptyState title="No hay bolo que anunciar." description="Confirma una fecha en el calendario y aquí tendrás su cartel en un toque." />
      </div>
    );
  }

  return (
    <div data-modulo="reels" className="mx-auto grid max-w-5xl gap-5 px-4 py-4 md:grid-cols-[minmax(0,1fr)_22rem] md:gap-8 md:py-6">
      {/* Bloque 1 · el bolo */}
      <div className="md:col-start-2 md:row-start-1">
        <Select aria-label="Bolo" value={ed.concierto.id} onChange={(e) => ed.elegirConcierto(e.target.value)}>
          {ed.opciones.map((c) => (
            <option key={c.id} value={c.id}>
              {fechaCartel(c.fecha).toLowerCase()} · {c.sala}
              {c.ciudad ? `, ${c.ciudad}` : ''}
            </option>
          ))}
        </Select>
      </div>

      {/* Bloque 2 · el cartel */}
      <div className="grid gap-3 md:col-start-1 md:row-span-3 md:row-start-1">
        <Tabs aria-label="Formato" layout="fill" items={PESTANAS} value={ed.formato} onChange={(f: FormatoCartel) => ed.setFormato(f)} />
        <div className="grid place-items-center rounded-[var(--r-l)] bg-[var(--sunken)] p-3 md:p-6">
          <canvas ref={canvasRef} aria-label={`Vista previa del cartel, formato ${FORMATOS[ed.formato].etiqueta}`}
            className="block h-auto max-h-[52vh] w-auto max-w-full rounded-[var(--r-s)] md:max-h-[72vh]" />
        </div>
      </div>

      {/* Bloque 3 · fondo y acciones */}
      <div className="grid content-start gap-4 md:col-start-2 md:row-start-2">
        <SelectorFondo
          fondo={ed.fondo}
          onFondo={ed.elegirFondo}
          foto={ed.foto}
          onFoto={ed.elegirFoto}
          fondosIa={ed.fondosIa}
          onGenerarIa={ed.generarIa}
          generando={ed.generando}
        />

        {ed.error && <p role="alert" className="rounded-[var(--r-s)] bg-[var(--alert-soft)] px-3 py-2 text-sm text-[var(--alert)]">{ed.error}</p>}

        <div className="flex items-center gap-2">
          <Button variant="primary" size="lg" className="flex-1" onClick={ed.compartir} disabled={ed.exportando}>
            <Share2 className="size-4" aria-hidden />
            {ed.exportando ? 'Preparando…' : 'Compartir'}
          </Button>
          <ActionMenu
            label="Más opciones del cartel"
            items={[
              { label: 'Descargar', icon: Download, onSelect: ed.descargar },
              { label: 'Descargar los 3 formatos', icon: FileArchive, onSelect: ed.descargarTodos },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default CarteleriaView;
