import React, { useState } from 'react';
import { Button, EmptyState, Onda, SkeletonText, Tabs, type TabItem } from '../ui';
import type { Modo } from '../../utils/asesor/diagnostico';
import type { Tarjeta } from '../../utils/asesor/opciones';
import { useAsesor } from './hooks/useAsesor';
import { TarjetaHoy } from './TarjetaHoy';
import { PiezaSheet } from './PiezaSheet';
import { FormEstrategia } from './FormEstrategia';
import { PorMedirCard } from './PorMedirCard';
import { AgendaAsesor } from './AgendaAsesor';
import { ResumenCard } from './ResumenCard';
import type { BandaLaminas } from './hooks/useLaminas';

type Pestana = 'hoy' | 'calendario' | 'resultados' | 'estrategia';

const MODO: Record<Modo, string> = {
  concierto: 'Modo concierto',
  lanzamiento: 'Modo estreno',
  rescate: 'Cambiar de rumbo',
  reactivar: 'Volver a publicar',
  fondo: 'Hacer comunidad',
};

const INICIAL_DIA = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const inicialDia = (fecha: string) => INICIAL_DIA[new Date(`${fecha}T12:00:00Z`).getUTCDay()];

interface Props {
  onNavigate: (vista: 'carteleria', opciones: { concertId: string }) => void;
  /** Nombre y logo de la banda activa: firman las imágenes de stories y carruseles. */
  banda: BandaLaminas;
}

/**
 * Asesor de Marketing: abrir y saber qué publicar hoy, dónde y por qué, con varias ideas para
 * elegir. El plan lo decide el servidor sin IA; la IA solo escribe la pieza cuando la banda la pide.
 * En móvil caben tres bloques antes del scroll: el momento (con la semana), la idea principal y la siguiente.
 */
const AsesorView: React.FC<Props> = ({ onNavigate, banda }) => {
  const a = useAsesor();
  const [pestana, setPestana] = useState<Pestana>('hoy');
  const [abierta, setAbierta] = useState<Tarjeta | null>(null);

  if (a.cargando) {
    return <div data-modulo="reels" className="mx-auto max-w-2xl px-4 py-6"><SkeletonText lines={6} /></div>;
  }

  if (!a.estado) {
    return (
      <div data-modulo="reels" className="mx-auto max-w-2xl px-4 py-8">
        <EmptyState title="El asesor no ha llegado a la prueba de sonido." description={a.error ?? undefined}
          action={<Button onClick={() => void a.recargar()}>Reintentar</Button>} />
      </div>
    );
  }

  const { diagnostico, opciones, semana, porMedir, resumen, agenda, estrategia, tieneEstrategia } = a.estado;
  const pestanas: TabItem<Pestana>[] = [
    { id: 'hoy', label: 'Hoy' },
    { id: 'calendario', label: 'Calendario' },
    { id: 'resultados', label: porMedir.length ? `Resultados (${porMedir.length})` : 'Resultados' },
    { id: 'estrategia', label: 'Estrategia' },
  ];
  const hechasSemana = semana.reduce((n, d) => n + d.hechas, 0);
  const preparar = (t: Tarjeta) => {
    setAbierta(t);
    void a.preparar(t.id);
  };
  const irAlCartel = (vista: 'carteleria', concertId: string) => onNavigate(vista, { concertId });
  // La tarjeta abierta se refresca con el plan recargado (p. ej. al marcarla como hecha).
  const tarjetaAbierta = abierta && ([...opciones.recomendadas, ...opciones.alternativas].find((t) => t.id === abierta.id) ?? abierta);

  return (
    <div data-modulo="reels" className="mx-auto grid max-w-2xl gap-5 px-4 py-4 md:py-6">
      {/* Bloque 1 · en qué momento estáis y cómo va la semana */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
        <div className="grid gap-1">
          <p className="text-sm font-medium text-[var(--acc-ink)]">{MODO[diagnostico.modo]}</p>
          <h1 className="text-xl font-semibold text-[var(--ink)] text-balance">{diagnostico.porque}</h1>
        </div>
        <div className="grid justify-items-end gap-1">
          {hechasSemana > 0 && (
            <Onda data={semana.map((d) => ({ label: inicialDia(d.fecha), value: d.hechas }))} height={40} barWidth={8} gap={6} animated={false} className="w-34" />
          )}
          <span className="text-xs text-[var(--ink-2)] tabular-nums">{hechasSemana ? `${hechasSemana} esta semana` : 'Semana por estrenar'}</span>
        </div>
      </header>

      <Tabs<Pestana> aria-label="Asesor" layout="fill" items={pestanas} value={pestana} onChange={setPestana} />

      {a.error && <p role="alert" className="text-sm text-[var(--alert)]">{a.error}</p>}

      {pestana === 'hoy' && (
        <>
          {!tieneEstrategia && (
            <div className="flex flex-wrap items-center gap-3 rounded-[var(--r-m)] bg-[var(--acc-soft)] p-4 text-sm text-[var(--acc-ink)]">
              <p className="min-w-0 flex-1">Esto es un plan de serie. Contadnos qué queréis y cuánto tiempo tenéis y será vuestro.</p>
              <Button size="sm" variant="raised" onClick={() => setPestana('estrategia')}>Hacer la estrategia</Button>
            </div>
          )}

          {porMedir.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-[var(--r-m)] bg-[var(--acc-soft)] p-4 text-sm text-[var(--acc-ink)]">
              <p className="min-w-0 flex-1">{porMedir.length === 1 ? 'Una publicación espera sus números' : `${porMedir.length} publicaciones esperan sus números`}: así sabremos qué os funciona.</p>
              <Button size="sm" variant="raised" onClick={() => setPestana('resultados')}>Anotarlos</Button>
            </div>
          )}

          {/* Bloque 2 · lo que os recomendamos hoy */}
          <section className="grid gap-3" aria-label="Recomendado para hoy">
            {opciones.recomendadas.map((t) => (
              <TarjetaHoy key={t.id} tarjeta={t} ocupada={a.ocupadas.has(t.id)} onPreparar={preparar} onAccion={a.accion} onAtajo={irAlCartel} />
            ))}
          </section>

          {/* Bloque 3 · si no os encaja, otras ideas para el mismo día */}
          {opciones.alternativas.length > 0 && (
            <section className="grid gap-2" aria-labelledby="otras-ideas">
              <h2 id="otras-ideas" className="text-sm font-medium text-[var(--ink-2)]">¿No os encaja? Otras ideas para hoy</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {opciones.alternativas.map((t) => (
                  <TarjetaHoy key={t.id} compacta tarjeta={t} ocupada={a.ocupadas.has(t.id)} onPreparar={preparar} onAccion={a.accion} onAtajo={irAlCartel} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {pestana === 'calendario' && <AgendaAsesor agenda={agenda} onHoy={() => setPestana('hoy')} />}

      {pestana === 'resultados' && (
        <section className="grid gap-4" aria-label="Resultados">
          {a.anotado && (
            <div role="status" className="grid gap-2 rounded-[var(--r-m)] bg-[var(--acc-soft)] p-4 text-[var(--acc-ink)]">
              <p className="text-sm font-medium">Anotado: {a.anotado.titulo}</p>
              <p className="text-sm">{a.anotado.mensaje}</p>
              <div><Button size="sm" variant="raised" onClick={a.cerrarAnotado}>Vale</Button></div>
            </div>
          )}
          {porMedir.length > 0 && (
            <div className="grid gap-3">
              <h2 className="text-sm font-medium text-[var(--ink-2)]">Esperan sus números</h2>
              {porMedir.map((p) => <PorMedirCard key={`${p.fecha}-${p.tarjetaId}`} pieza={p} onGuardar={(m) => a.medir(p, m)} />)}
            </div>
          )}
          {resumen && <ResumenCard resumen={resumen} />}
          {!porMedir.length && !resumen && !a.anotado && (
            <EmptyState title="Aún no hay números que mirar."
              description="Marca una pieza como publicada y, dos días después, apunta aquí cuántas personas la vieron y la guardaron. Con eso sabremos qué os funciona." />
          )}
        </section>
      )}

      {pestana === 'estrategia' && (
        <FormEstrategia inicial={estrategia} guardando={a.guardando} sugiriendo={a.sugiriendo} onGuardar={a.guardar} onProponer={a.proponer} />
      )}

      {tarjetaAbierta && (
        <PiezaSheet
          tarjeta={tarjetaAbierta}
          banda={banda}
          estado={a.piezas[tarjetaAbierta.id]}
          ocupada={a.ocupadas.has(tarjetaAbierta.id)}
          onCerrar={() => setAbierta(null)}
          onOtraVersion={() => void a.preparar(tarjetaAbierta.id, true)}
          onHecha={() => void a.accion(tarjetaAbierta.id, 'hecho')}
        />
      )}
    </div>
  );
};

export default AsesorView;
