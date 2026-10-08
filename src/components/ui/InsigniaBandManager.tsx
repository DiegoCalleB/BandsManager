import React, { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';
import { safeUrl } from '../../utils/safeUrl';

export interface InsigniaBandManagerProps {
  /** Id de la banda cuya página se está viendo (la insignia depende de su plan, que no sale del servidor). */
  bandId: string | undefined;
  /** Superficie donde se enseña: se registra en la UTM para saber cuál convierte más. */
  origen: 'epk' | 'fans' | 'concierto';
  className?: string;
}

/**
 * «Powered by BandManager.io» al pie de las páginas públicas de una banda. Solo la llevan los planes
 * gratuitos: el servidor decide y devuelve el enlace (o null). Es el canal de crecimiento del
 * producto, así que NUNCA puede romper ni retrasar la página: sin enlace, sin red o con cualquier
 * fallo, no se pinta nada. Sin sesión ni cookies: es una petición pública y anónima.
 */
export function InsigniaBandManager({ bandId, origen, className }: InsigniaBandManagerProps) {
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    if (!bandId) return;
    let vivo = true;
    fetch(`/api/public/insignia?b=${encodeURIComponent(bandId)}&o=${origen}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (vivo && d && typeof d.href === 'string') setHref(safeUrl(d.href) ?? null);
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [bandId, origen]);

  if (!href) return null;
  return (
    <p className={cn('text-xs text-[var(--ink-2)] print:hidden', className)}>
      Powered by{' '}
      <a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--acc-ink)] hover:underline">
        BandManager.io
      </a>
    </p>
  );
}
