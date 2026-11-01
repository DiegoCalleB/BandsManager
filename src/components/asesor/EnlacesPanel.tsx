import React from 'react';
import { Button, Card, Chip } from '../ui';
import { fechaCorta } from '../../utils/campanaConcierto';
import type { DestinoEnlace } from '../../utils/asesor/auditoria';
import type { Presencia } from '../../utils/asesor/presencia';
import type { Red } from '../../utils/asesor/reglasFormato';
import { ETIQUETA_FORMATO } from '../../utils/asesor/resumen';
import { BotonCopiar } from './BotonCopiar';
import { NOMBRE_RED } from './nombres';

const DESTINO: Record<DestinoEnlace, string> = { entradas: 'las entradas del bolo', concierto: 'la página del bolo', epk: 'vuestro dossier', fans: 'vuestra comunidad' };
const CLICS_SEMANALES: Record<Presencia['instagram']['clicsSemanalesEstado'], string> = {
  bajo: 'Los clics semanales de Instagram están por debajo de lo sano (entre el 0,5 y el 2 % de vuestros seguidores). Mirad que el enlace se vea y que la bio invite a pulsarlo.',
  sano: 'Los clics semanales de Instagram están en la horquilla sana (0,5 a 2 % de vuestros seguidores).',
  alto: 'Los clics semanales de Instagram superan la horquilla habitual (más del 2 % de vuestros seguidores): buena señal.',
  sin_datos: '',
};

interface Props {
  enlaces: Presencia['enlaces'];
  instagram: Presencia['instagram'];
  creando: ReadonlySet<Red>;
  onCrear: (red: Red) => void;
}

/**
 * Un enlace con seguimiento por red y lo que traen. El enlace de la bio es uno solo por red, así que
 * no dice qué pieza trajo cada clic; lo que sí enseña es si los días con publicación suben los clics.
 */
export function EnlacesPanel({ enlaces, instagram, creando, onCrear }: Props) {
  const { recomendado, porRed, clicsTrasPublicar } = enlaces;
  return (
    <div className="grid gap-5">
      <section className="grid gap-1.5 rounded-[var(--r-m)] bg-[var(--acc-soft)] p-4 text-[var(--acc-ink)]" aria-label="A dónde debería llevar">
        <h3 className="text-sm font-medium">Ahora, el enlace de la bio debería llevar a {DESTINO[recomendado.destino]}</h3>
        <p className="text-sm">{recomendado.motivo}</p>
      </section>

      <section className="grid gap-2" aria-label="Enlaces por red">
        <h3 className="text-sm font-medium text-[var(--ink)]">Un enlace por red</h3>
        {porRed.map((e) => (
          <Card key={e.red} as="article" radius="m" className="grid gap-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-medium text-[var(--ink)]">{NOMBRE_RED[e.red]}</span>
              {e.url && <Chip>{e.clics7} {e.clics7 === 1 ? 'clic' : 'clics'} en 7 días</Chip>}
              {e.url && e.destino && e.destino !== recomendado.destino && <Chip tone="alert">Lleva a {DESTINO[e.destino]}</Chip>}
            </div>
            {e.url ? (
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-sm text-[var(--ink-2)]">{e.url}</span>
                <BotonCopiar texto={e.url} etiqueta={`Copiar enlace de ${NOMBRE_RED[e.red]}`} />
              </div>
            ) : (
              <div>
                <Button size="sm" variant="neutral" disabled={creando.has(e.red)} onClick={() => onCrear(e.red)}>
                  {creando.has(e.red) ? 'Creando…' : `Crear enlace de ${NOMBRE_RED[e.red]}`}
                </Button>
              </div>
            )}
          </Card>
        ))}
        {CLICS_SEMANALES[instagram.clicsSemanalesEstado] && <p className="text-sm text-[var(--ink-2)]">{CLICS_SEMANALES[instagram.clicsSemanalesEstado]}</p>}
      </section>

      <section className="grid gap-2" aria-label="Clics tras publicar">
        <h3 className="text-sm font-medium text-[var(--ink)]">Clics en las 48 h siguientes a publicar</h3>
        {clicsTrasPublicar.length === 0 ? (
          <p className="text-sm text-[var(--ink-2)]">Cuando marquéis piezas como publicadas, aquí veréis si los días con publicación suben los clics.</p>
        ) : (
          <ul className="grid gap-2">
            {clicsTrasPublicar.map((c) => (
              <li key={`${c.fecha}-${c.tarjetaId}`} className="grid gap-0.5 rounded-[var(--r-s)] bg-[var(--sunken)] p-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Chip tone="acc">{ETIQUETA_FORMATO[c.formato]}</Chip>
                  <span className="text-xs text-[var(--ink-2)]">{fechaCorta(c.fecha)}</span>
                  {!c.completa && <Chip>Aún sumando</Chip>}
                </div>
                <p className="text-sm font-medium text-[var(--ink)]">{c.titulo}</p>
                <p className="text-sm text-[var(--ink-2)]">
                  {c.total} {c.total === 1 ? 'clic' : 'clics'}
                  {Object.keys(c.porCanal).length > 0 && ` (${Object.entries(c.porCanal).map(([canal, n]) => `${NOMBRE_RED[canal as Red] ?? canal} ${n}`).join(', ')})`}
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-[var(--ink-2)]">Aproximado: el enlace de la bio es el mismo para todas las piezas, así que no distingue cuál trajo cada clic.</p>
      </section>
    </div>
  );
}
