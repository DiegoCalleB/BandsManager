import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';
import { Button, EmptyState, IconButton, SkeletonText, Tabs, type TabItem } from '../ui';
import { usePresencia } from './hooks/usePresencia';
import { AuditoriaPanel } from './AuditoriaPanel';
import { EnlacesPanel } from './EnlacesPanel';
import { SeoPanel } from './SeoPanel';

type Seccion = 'auditoria' | 'seo' | 'enlaces';
const SECCIONES: TabItem<Seccion>[] = [{ id: 'auditoria', label: 'Auditoría' }, { id: 'seo', label: 'SEO' }, { id: 'enlaces', label: 'Enlaces y clics' }];

/**
 * El equipo de especialistas revisando la presencia de la banda: auditoría 360, kit de SEO y enlaces
 * con seguimiento. Todo se calcula con lo que BandManager ya sabe (sin IA); lo que falta, se pide.
 */
export function PresenciaSheet({ onCerrar }: { onCerrar: () => void }) {
  const p = usePresencia();
  const [seccion, setSeccion] = useState<Seccion>('auditoria');

  return (
    <ModalPortal isOpen onClose={onCerrar}>
      <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-[var(--scrim)]/75 sm:items-center sm:p-4" onClick={onCerrar}>
        <div role="dialog" aria-modal="true" aria-label="Revisar presencia" data-modulo="reels"
          className="flex h-[88vh] max-h-[92vh] w-full max-w-xl flex-col rounded-t-[var(--r-xl)] bg-[var(--surface)] text-[var(--ink)] sm:rounded-[var(--r-xl)]"
          onClick={(e) => e.stopPropagation()}>
          <header className="flex items-start gap-3 px-5 pb-3 pt-5">
            <div className="grid min-w-0 flex-1 gap-0.5">
              <h2 className="text-lg font-semibold">Revisar vuestra presencia</h2>
              <p className="text-xs text-[var(--ink-2)]">Un equipo de especialistas revisa lo que sabemos de vosotros. Lo que no sabemos, os lo pedimos.</p>
            </div>
            <IconButton label="Cerrar" variant="ghost" onClick={onCerrar}><X className="size-5" aria-hidden /></IconButton>
          </header>

          <div className="px-5 pb-3"><Tabs<Seccion> aria-label="Secciones" layout="fill" items={SECCIONES} value={seccion} onChange={setSeccion} /></div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
            {p.error && <p role="alert" className="pb-3 text-sm text-[var(--alert)]">{p.error}</p>}
            {!p.presencia && p.cargando && <div className="grid gap-3 py-2" aria-live="polite"><p className="text-sm text-[var(--ink-2)]">Revisando vuestra presencia…</p><SkeletonText lines={8} /></div>}
            {!p.presencia && !p.cargando && (
              <EmptyState title="No hemos podido revisar la presencia." description={p.error ?? undefined} action={<Button onClick={() => void p.revisarDeNuevo()}>Reintentar</Button>} />
            )}
            {p.presencia && seccion === 'auditoria' && <AuditoriaPanel presencia={p.presencia} bios={p.bios} cargando={p.cargando} onBio={p.ponerBio} onRevisar={() => void p.revisarDeNuevo()} />}
            {p.presencia && seccion === 'seo' && <SeoPanel kit={p.presencia.kit} />}
            {p.presencia && seccion === 'enlaces' && <EnlacesPanel enlaces={p.presencia.enlaces} instagram={p.presencia.instagram} creando={p.creando} onCrear={(red) => void p.crearEnlaceDeRed(red)} />}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
