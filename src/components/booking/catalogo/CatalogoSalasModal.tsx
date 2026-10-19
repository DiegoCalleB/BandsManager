import { Check, Plus, Search, X } from 'lucide-react';
import { ModalPortal } from '../../common/ModalPortal';
import { Button, Chip, EmptyState, IconButton, Input, Select, Skeleton } from '../../ui';
import type { SalaDelCatalogo } from '../../../services/apiCatalogo';
import { useCatalogoSalas } from './useCatalogoSalas';

interface CatalogoSalasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIPOS = [
  { valor: '', texto: 'Todos los tipos' },
  { valor: 'sala', texto: 'Salas' },
  { valor: 'festival', texto: 'Festivales' },
  { valor: 'discoteca', texto: 'Discotecas' },
  { valor: 'ayuntamiento', texto: 'Ayuntamientos' },
];

const NIVEL: Record<SalaDelCatalogo['nivel'], { etiqueta: string; tono: 'ok' | 'neutral' } | null> = {
  verificada: { etiqueta: 'Verificada', tono: 'ok' },
  probable: { etiqueta: 'Probable', tono: 'ok' },
  sin_verificar: null,
};

const resumen = (s: SalaDelCatalogo) => [s.ciudad, s.region && s.region !== s.ciudad ? s.region : null, s.aforo ? `${s.aforo} personas` : null, s.genero].filter(Boolean).join(' · ');

/** Explorar el catálogo compartido de salas y añadir las que encajen a la agenda de la banda. */
export function CatalogoSalasModal({ isOpen, onClose }: CatalogoSalasModalProps) {
  const { filtros, cambiar, resultado, cargando, fallo, reintentar, anadir, anadiendo, errorAlta } = useCatalogoSalas(isOpen);
  if (!isOpen) return null;

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto overscroll-contain bg-[var(--scrim)]/90 p-2 pb-24 pt-2 sm:items-center sm:p-6 animate-fadeIn">
        <div role="dialog" aria-modal="true" aria-label="Catálogo de salas" className="my-auto flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-[var(--r-l)] bg-[var(--surface)] text-[var(--ink)] sm:max-h-[90vh]">
          <div className="flex shrink-0 items-start justify-between gap-3 bg-[var(--bg)]/60 p-4 sm:p-5">
            <div>
              <h2 className="text-base font-bold text-[var(--acc-ink)]">Catálogo de salas</h2>
              <p className="text-xs text-[var(--ink-2)] text-pretty">Las salas que han encontrado todas las bandas, las más fiables primero. Al añadirla, la sala pasa a tu agenda con su contacto.</p>
            </div>
            <IconButton label="Cerrar catálogo" onClick={onClose}>
              <X className="h-4 w-4" />
            </IconButton>
          </div>

          <div className="grid shrink-0 grid-cols-1 gap-2 p-4 sm:grid-cols-[1fr_1fr_auto] sm:px-5">
            <div className="relative">
              <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-3)]" />
              <Input aria-label="Buscar por nombre o género" className="pl-9" placeholder="Nombre o género" value={filtros.texto} onChange={(e) => cambiar({ texto: e.target.value })} />
            </div>
            <Input aria-label="Ciudad o región" placeholder="Ciudad o región" value={filtros.lugar} onChange={(e) => cambiar({ lugar: e.target.value })} />
            <Select aria-label="Tipo de espacio" value={filtros.tipo} onChange={(e) => cambiar({ tipo: e.target.value })}>
              {TIPOS.map((t) => (
                <option key={t.valor} value={t.valor}>{t.texto}</option>
              ))}
            </Select>
            <label className="flex items-center gap-2 text-xs text-[var(--ink-2)] sm:col-span-3">
              <input type="checkbox" checked={filtros.conContacto} onChange={(e) => cambiar({ conContacto: e.target.checked })} />
              Solo salas con contacto para escribirles
            </label>
          </div>

          {errorAlta && <p role="alert" className="mx-4 mb-2 rounded-[var(--r-m)] bg-[var(--alert-soft)] px-3.5 py-2.5 text-sm text-[var(--alert)] sm:mx-5">{errorAlta}</p>}

          <div className="flex-1 overflow-y-auto px-4 pb-4 sm:px-5 sm:pb-5">
            {cargando && !resultado ? (
              <ul className="space-y-2" aria-busy="true" aria-label="Buscando salas">
                {[0, 1, 2, 3].map((i) => (
                  <li key={i}><Skeleton className="h-16" /></li>
                ))}
              </ul>
            ) : fallo ? (
              <EmptyState compact title="No hemos podido abrir el catálogo." description="Prueba otra vez en un momento." action={<Button size="sm" variant="neutral" onClick={reintentar}>Reintentar</Button>} />
            ) : !resultado || resultado.salas.length === 0 ? (
              <EmptyState compact title="Ninguna sala encaja con eso." description="Prueba con otra ciudad o quita algún filtro. Si no está, pídele al chat que la busque por ti." />
            ) : (
              <>
                <p className="pb-2 text-xs text-[var(--ink-2)] tabular-nums" aria-live="polite">
                  {resultado.total > resultado.mostradas ? `Mostrando ${resultado.mostradas} de ${resultado.total}. Afina la búsqueda para ver el resto.` : `${resultado.total} ${resultado.total === 1 ? 'sala' : 'salas'}`}
                </p>
                <ul className={`space-y-2 transition-opacity ${cargando ? 'opacity-60' : ''}`}>
                  {resultado.salas.map((s) => {
                    const nivel = NIVEL[s.nivel];
                    const sumando = anadiendo.has(s.id);
                    return (
                      <li key={s.id} className="flex items-start gap-3 rounded-[var(--r-m)] bg-[var(--bg)] p-3.5">
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <p className="truncate text-sm font-semibold">{s.nombre}</p>
                          <p className="truncate text-xs text-[var(--ink-2)]">{resumen(s)}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {nivel && <Chip tone={nivel.tono}>{nivel.etiqueta}</Chip>}
                            {s.tipo !== 'sala' && <Chip>{s.tipo}</Chip>}
                            {s.bandas_con_respuesta > 0 && <Chip tone="acc">{s.bandas_con_respuesta === 1 ? 'Ha respondido a 1 banda' : `Ha respondido a ${s.bandas_con_respuesta} bandas`}</Chip>}
                            {!s.tiene_email && !s.tiene_telefono && <Chip>Sin contacto</Chip>}
                          </div>
                        </div>
                        {s.ya_en_agenda ? (
                          <span className="flex shrink-0 items-center gap-1 pt-1 text-xs font-medium text-[var(--ok)]"><Check className="h-3.5 w-3.5" aria-hidden />En tu agenda</span>
                        ) : (
                          <Button size="sm" variant="primary" disabled={sumando} onClick={() => void anadir(s.id)} aria-label={`Añadir ${s.nombre} a mi agenda`}>
                            <Plus className="h-3.5 w-3.5" aria-hidden />{sumando ? 'Añadiendo…' : 'Añadir'}
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
