import React, { useState } from 'react';
import { Button, EmptyState, SkeletonText, Tabs, type TabItem } from '../ui';
import type { Modo } from '../../utils/asesor/diagnostico';
import { useAsesor } from './hooks/useAsesor';
import { TarjetaHoy } from './TarjetaHoy';
import { FormEstrategia } from './FormEstrategia';

type Pestana = 'hoy' | 'estrategia';
const PESTANAS: TabItem<Pestana>[] = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'estrategia', label: 'Estrategia' },
];

const MODO: Record<Modo, string> = {
  concierto: 'Modo concierto',
  lanzamiento: 'Modo estreno',
  reactivar: 'Volver a publicar',
  fondo: 'Hacer comunidad',
};

interface Props {
  onNavigate: (vista: 'carteleria', opciones: { concertId: string }) => void;
}

/**
 * Asesor de Marketing: abrir y saber qué publicar hoy, dónde y por qué. El plan lo decide el
 * servidor sin IA a partir de los bolos, el próximo lanzamiento y la estrategia de la banda.
 * Tres bloques en móvil: el momento, lo de hoy y la estrategia (en su pestaña).
 */
const AsesorView: React.FC<Props> = ({ onNavigate }) => {
  const a = useAsesor();
  const [pestana, setPestana] = useState<Pestana>('hoy');

  if (a.cargando) {
    return (
      <div data-modulo="reels" className="mx-auto max-w-2xl px-4 py-6"><SkeletonText lines={6} /></div>
    );
  }

  if (!a.estado) {
    return (
      <div data-modulo="reels" className="mx-auto max-w-2xl px-4 py-8">
        <EmptyState title="El asesor no ha llegado a la prueba de sonido." description={a.error ?? undefined}
          action={<Button onClick={() => void a.recargar()}>Reintentar</Button>} />
      </div>
    );
  }

  const { diagnostico, tarjetas, estrategia, tieneEstrategia } = a.estado;

  return (
    <div data-modulo="reels" className="mx-auto grid max-w-2xl gap-5 px-4 py-4 md:py-6">
      {/* Bloque 1 · en qué momento estáis */}
      <header className="grid gap-1">
        <p className="text-sm font-medium text-[var(--acc-ink)]">{MODO[diagnostico.modo]}</p>
        <h1 className="text-xl font-semibold text-[var(--ink)]">{diagnostico.porque}</h1>
      </header>

      <Tabs<Pestana> aria-label="Asesor" layout="fill" items={PESTANAS} value={pestana} onChange={setPestana} />

      {a.error && <p role="alert" className="text-sm text-[var(--alert)]">{a.error}</p>}

      {pestana === 'hoy' ? (
        <section className="grid gap-3" aria-label="Qué publicar hoy">
          {!tieneEstrategia && (
            <div className="flex flex-wrap items-center gap-3 rounded-[var(--r-m)] bg-[var(--acc-soft)] p-4 text-sm text-[var(--acc-ink)]">
              <p className="min-w-0 flex-1">Esto es un plan de serie. Contadnos qué queréis y cuánto tiempo tenéis y será vuestro.</p>
              <Button size="sm" variant="raised" onClick={() => setPestana('estrategia')}>Hacer la estrategia</Button>
            </div>
          )}
          {/* Bloque 2 · lo de hoy */}
          {tarjetas.map((t) => (
            <TarjetaHoy key={t.id} tarjeta={t} onAtajo={(vista, concertId) => onNavigate(vista, { concertId })} />
          ))}
        </section>
      ) : (
        <FormEstrategia inicial={estrategia} guardando={a.guardando} sugiriendo={a.sugiriendo} onGuardar={a.guardar} onProponer={a.proponer} />
      )}
    </div>
  );
};

export default AsesorView;
