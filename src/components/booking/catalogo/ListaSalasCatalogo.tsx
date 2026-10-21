import { Check, ChevronRight, Plus, Users } from 'lucide-react';
import { Button, Chip } from '../../ui';
import type { SalaDelCatalogo } from '../../../services/apiCatalogo';
import { LogoSala } from './LogoSala';

const NIVEL: Record<SalaDelCatalogo['nivel'], { etiqueta: string; tono: 'ok' } | null> = {
  verificada: { etiqueta: 'Verificada', tono: 'ok' },
  probable: { etiqueta: 'Probable', tono: 'ok' },
  sin_verificar: null,
};

const resumen = (s: SalaDelCatalogo) => [s.ciudad, s.region && s.region !== s.ciudad ? s.region : null, s.genero].filter(Boolean).join(' · ');

interface ListaSalasCatalogoProps {
  salas: SalaDelCatalogo[];
  cargando: boolean;
  anadiendo: ReadonlySet<string>;
  onAnadir: (id: string) => void;
  onAbrir: (sala: SalaDelCatalogo) => void;
}

/** Filas del catálogo: pulsar la sala abre su ficha; el botón la añade sin abrirla. */
export function ListaSalasCatalogo({ salas, cargando, anadiendo, onAnadir, onAbrir }: ListaSalasCatalogoProps) {
  return (
    <ul className={`space-y-2 transition-opacity ${cargando ? 'opacity-60' : ''}`}>
      {salas.map((s) => {
        const nivel = NIVEL[s.nivel];
        const contacto = [s.tiene_email && 'Email', s.tiene_telefono && 'Teléfono', s.instagram && 'Instagram', s.website && 'Web'].filter(Boolean).join(' · ');
        return (
          <li key={s.id} className="space-y-3 rounded-[var(--r-m)] bg-[var(--bg)] p-3.5">
            <button type="button" onClick={() => onAbrir(s)} aria-label={`Ver ficha de ${s.nombre}`} className="flex w-full min-w-0 items-start gap-3 rounded-[var(--r-s)] text-left transition-ui hover:opacity-80">
              <LogoSala nombre={s.nombre} website={s.website} />
              <span className="min-w-0 flex-1 space-y-1.5">
                <span className="block line-clamp-2 text-sm font-semibold text-balance">{s.nombre}</span>
                <span className="block text-xs text-[var(--ink-2)]">{resumen(s)}</span>
                <span className="flex flex-wrap gap-1.5">
                  {s.aforo ? <Chip><Users className="mr-1 inline h-3 w-3" aria-hidden /><span className="tabular-nums">{s.aforo}</span> personas</Chip> : <Chip>Aforo sin dato</Chip>}
                  <Chip>{s.tipo}</Chip>
                  {nivel && <Chip tone={nivel.tono}>{nivel.etiqueta}</Chip>}
                  {s.bandas_con_respuesta > 0 && <Chip tone="acc">{s.bandas_con_respuesta === 1 ? 'Ha respondido a 1 banda' : `Ha respondido a ${s.bandas_con_respuesta} bandas`}</Chip>}
                  {s.posiblemente_cerrada && <Chip tone="alert">Google la da por cerrada</Chip>}
                </span>
              </span>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[var(--ink-3)]" aria-hidden />
            </button>
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 text-xs text-[var(--ink-2)]">{contacto ? `Contacto: ${contacto}` : 'Sin contacto todavía'}</p>
              {s.ya_en_agenda ? (
                <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-[var(--ok)]"><Check className="h-3.5 w-3.5" aria-hidden />En tu agenda</span>
              ) : (
                <Button size="sm" variant="primary" className="shrink-0" disabled={anadiendo.has(s.id)} onClick={() => onAnadir(s.id)} aria-label={`Añadir ${s.nombre} a mi agenda`}>
                  <Plus className="h-3.5 w-3.5" aria-hidden />{anadiendo.has(s.id) ? 'Añadiendo…' : 'Añadir'}
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
