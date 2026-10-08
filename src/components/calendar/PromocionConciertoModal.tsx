import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy, Link2, Send, Sparkles, Trash2, X } from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';
import { Button, Card, Chip, EmptyState, IconButton, LinkButton, Onda, Tabs, Textarea } from '../ui';
import type { Concert } from '../../types';
import { apiFetch } from '../../utils/api';
import { copyToClipboard } from '../../utils/shareUtils';
import {
  CANALES_PUBLICACION,
  describirCuando,
  fechaCorta,
  plataformaDeCanal,
  planificarCampana,
  type CanalPublicacion,
  type HitoId,
} from '../../utils/campanaConcierto';
import {
  borrarEnlace,
  crearEnlace,
  listarEnlaces,
  redactarPieza,
  type EnlaceCorto,
  type ListadoEnlaces,
  type PiezaRedactada,
} from '../../utils/promocionApi';

interface PromocionConciertoModalProps {
  isOpen: boolean;
  onClose: () => void;
  concert: Concert;
}

const ETIQUETA_CANAL: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
  youtube: 'YouTube',
  email: 'Correo',
  cartel: 'Cartel (QR)',
  web: 'Página del concierto',
  otro: 'Otro',
};
const ETIQUETA_DESTINO: Record<string, string> = {
  entradas: 'Entradas',
  concierto: 'Página del concierto',
  epk: 'Dossier',
  fans: 'Alta de fans',
};

const hoyMadrid = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
const clave = (hito: HitoId, canal: CanalPublicacion) => `${hito}|${canal}`;
const mensajeDe = (e: unknown, defecto: string) => (e instanceof Error && e.message ? e.message : defecto);

export function PromocionConciertoModal({ isOpen, onClose, concert }: PromocionConciertoModalProps) {
  const hoy = useMemo(hoyMadrid, [isOpen]);
  const hitos = useMemo(() => planificarCampana(concert.fecha, hoy), [concert.fecha, hoy]);
  const esPublico = concert.tipo !== 'privado' && !concert.is_posible;
  const sinEntradas = !concert.entradasUrl?.trim();

  const [canal, setCanal] = useState<CanalPublicacion>('instagram');
  const [abierto, setAbierto] = useState<HitoId | null>(null);
  const [piezas, setPiezas] = useState<Record<string, PiezaRedactada>>({});
  const [textos, setTextos] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [avisos, setAvisos] = useState<Record<string, string>>({});
  const [listado, setListado] = useState<ListadoEnlaces | null>(null);
  const [verEnlaces, setVerEnlaces] = useState(false);
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [errorListado, setErrorListado] = useState('');

  // Al abrir: primera pieza pendiente desplegada y estadísticas de enlaces de ESTE concierto.
  useEffect(() => {
    if (!isOpen) return;
    setAbierto(hitos[0]?.id ?? null);
    setAvisos({});
    setConfirmando(null);
    listarEnlaces(concert.id)
      .then((l) => {
        setListado(l);
        setErrorListado('');
      })
      .catch((e) => setErrorListado(mensajeDe(e, 'No se pudieron cargar los enlaces.')));
  }, [isOpen, concert.id, hitos]);

  const cargarPieza = useCallback(
    async (hito: HitoId, c: CanalPublicacion, usarIA = false) => {
      const k = clave(hito, c);
      setCargando(k);
      setErrores((prev) => ({ ...prev, [k]: '' }));
      try {
        const pieza = await redactarPieza({ concertId: concert.id, hito, canal: c, usarIA });
        setPiezas((prev) => ({ ...prev, [k]: pieza }));
        setTextos((prev) => ({ ...prev, [k]: pieza.variantes[0] }));
        if (usarIA && !pieza.generadaPorIA) {
          setAvisos((prev) => ({ ...prev, [k]: 'La IA no ha podido ayudar ahora. Te dejamos las plantillas.' }));
        }
      } catch (e) {
        setErrores((prev) => ({ ...prev, [k]: mensajeDe(e, 'No se pudo preparar la publicación.') }));
      } finally {
        setCargando(null);
      }
    },
    [concert.id]
  );

  // Se pide la pieza al desplegar un hito o cambiar de canal, una sola vez por combinación.
  useEffect(() => {
    if (!isOpen || !abierto || !esPublico) return;
    const k = clave(abierto, canal);
    if (!piezas[k] && cargando !== k && !errores[k]) void cargarPieza(abierto, canal);
  }, [isOpen, abierto, canal, esPublico, piezas, cargando, errores, cargarPieza]);

  const copiar = async (k: string, texto: string, extra?: string[]) => {
    const completo = extra?.length ? `${texto}\n\n${extra.join(' ')}` : texto;
    const ok = await copyToClipboard(completo);
    setAvisos((prev) => ({ ...prev, [k]: ok ? 'Copiado. Pégalo donde vayas a publicar.' : 'No se pudo copiar. Selecciona el texto a mano.' }));
  };

  const crearBorrador = async (k: string, hito: HitoId, pieza: PiezaRedactada) => {
    const plataforma = plataformaDeCanal(pieza.canal);
    const texto = (textos[k] ?? '').trim();
    const fecha = hitos.find((h) => h.id === hito)?.fecha;
    if (!plataforma || !texto || !fecha) return;
    try {
      const id = `post-cuenta-atras-${concert.id}-${hito}-${pieza.canal}`;
      await apiFetch(`/api/posts/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify({
          id,
          fecha,
          plataforma,
          contenido: texto,
          estado: 'borrador',
          responsable: 'Cuenta atrás',
          media_type: 'post',
          auto_publish: false,
          hashtags: pieza.hashtags,
        }),
      });
      setAvisos((prev) => ({ ...prev, [k]: `Borrador guardado en Redes para el ${fechaCorta(fecha)}. Revísalo antes de publicar.` }));
    } catch (e) {
      setAvisos((prev) => ({ ...prev, [k]: mensajeDe(e, 'No se pudo guardar el borrador.') }));
    }
  };

  const copiarEnlace = async (url: string) => {
    const ok = await copyToClipboard(url);
    setAvisos((prev) => ({ ...prev, enlaces: ok ? 'Enlace copiado.' : url }));
  };

  const copiarEnlacePagina = async () => {
    try {
      const r = await crearEnlace({ concertId: concert.id, destino: 'concierto', canal: 'otro' });
      const ok = await copyToClipboard(r.url);
      setAvisos((prev) => ({ ...prev, pagina: ok ? 'Enlace de la página del concierto copiado.' : r.url }));
      setListado(await listarEnlaces(concert.id));
    } catch (e) {
      setAvisos((prev) => ({ ...prev, pagina: mensajeDe(e, 'No se pudo crear el enlace.') }));
    }
  };

  const quitarEnlace = async (code: string) => {
    try {
      await borrarEnlace(code);
      setListado(await listarEnlaces(concert.id));
    } catch (e) {
      setErrorListado(mensajeDe(e, 'No se pudo borrar el enlace.'));
    } finally {
      setConfirmando(null);
    }
  };

  if (!isOpen) return null;

  const pasado = concert.fecha < hoy;
  const dias = ['', '', '', '', '', '', ''].map((_, i) => ({ label: String(i), value: listado?.totales.ultimos7[i] ?? 0 }));

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-[var(--scrim)]/75 sm:p-4" onClick={onClose}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Promocionar ${concert.sala}`}
          className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-t-[var(--r-xl)] sm:rounded-[var(--r-xl)] bg-[var(--surface)] text-[var(--ink)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-balance">Promocionar el concierto</h2>
              <p className="text-xs text-[var(--ink-2)] truncate">
                {concert.sala} · {concert.ciudad} · {fechaCorta(concert.fecha)}
              </p>
            </div>
            <IconButton label="Cerrar" onClick={onClose}>
              <X className="w-5 h-5" />
            </IconButton>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4">
            {!esPublico ? (
              <EmptyState
                title="Este bolo no es público."
                description="Los eventos privados y los bolos sin confirmar no se promocionan. Confírmalo en el calendario y vuelve."
              />
            ) : pasado ? (
              <EmptyState title="Este concierto ya sonó." description="Aquí puedes ver cuántos clics trajeron tus enlaces." compact />
            ) : (
              <>
                {sinEntradas && (
                  <Card tone="acc" radius="m" padding="sm" className="text-xs">
                    Aún no has puesto el enlace de entradas. Hasta entonces, tus enlaces llevan a la página del concierto.
                  </Card>
                )}

                <Tabs
                  aria-label="Dónde vas a publicar"
                  layout="fill"
                  value={canal}
                  onChange={(c) => setCanal(c as CanalPublicacion)}
                  items={CANALES_PUBLICACION.map((c) => ({ id: c.id, label: c.etiqueta }))}
                />

                <ol className="space-y-2" aria-label="Cuenta atrás">
                  {hitos.map((h) => {
                    const k = clave(h.id, canal);
                    const pieza = piezas[k];
                    const abiertoAhora = abierto === h.id;
                    return (
                      <li key={h.id}>
                        <Card tone="sunken" radius="m" padding="none">
                          <button
                            type="button"
                            className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left cursor-pointer"
                            aria-expanded={abiertoAhora}
                            onClick={() => setAbierto(abiertoAhora ? null : h.id)}
                          >
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold">{h.titulo}</span>
                              <span className="block text-xs text-[var(--ink-2)] text-pretty">{h.objetivo}</span>
                            </span>
                            <Chip tone={h.estado === 'hoy' ? 'acc' : 'neutral'}>{describirCuando(h.fecha, hoy)}</Chip>
                          </button>

                          {abiertoAhora && (
                            <div className="px-4 pb-4 space-y-3">
                              {cargando === k && !pieza && <p className="text-xs text-[var(--ink-2)]">Preparando la publicación…</p>}
                              {errores[k] && (
                                <div className="space-y-2" role="alert">
                                  <p className="text-xs text-[var(--alert)]">{errores[k]}</p>
                                  <LinkButton onClick={() => void cargarPieza(h.id, canal)}>Reintentar</LinkButton>
                                </div>
                              )}
                              {pieza && (
                                <>
                                  <div role="radiogroup" aria-label="Variante del texto" className="grid gap-2">
                                    {pieza.variantes.map((v, i) => {
                                      const elegida = (textos[k] ?? pieza.variantes[0]) === v;
                                      return (
                                        <button
                                          key={i}
                                          type="button"
                                          role="radio"
                                          aria-checked={elegida}
                                          onClick={() => setTextos((prev) => ({ ...prev, [k]: v }))}
                                          className={`text-left text-xs p-3 rounded-[var(--r-s)] cursor-pointer transition-ui ${
                                            elegida ? 'bg-[var(--surface)] text-[var(--ink)]' : 'bg-transparent text-[var(--ink-2)] hover:bg-[var(--surface)]'
                                          }`}
                                        >
                                          {v}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <Textarea
                                    aria-label="Texto de la publicación (puedes editarlo)"
                                    rows={3}
                                    value={textos[k] ?? ''}
                                    onChange={(e) => setTextos((prev) => ({ ...prev, [k]: e.target.value }))}
                                  />
                                  <p className="text-xs text-[var(--ink-2)] break-words">{pieza.hashtags.join(' ')}</p>
                                  <div className="flex flex-wrap gap-2">
                                    <Button size="sm" variant="primary" onClick={() => void copiar(k, textos[k] ?? '', pieza.hashtags)}>
                                      <Copy className="w-4 h-4" /> Copiar
                                    </Button>
                                    {plataformaDeCanal(pieza.canal) && (
                                      <Button size="sm" variant="neutral" onClick={() => void crearBorrador(k, h.id, pieza)}>
                                        <Send className="w-4 h-4" /> Guardar borrador en Redes
                                      </Button>
                                    )}
                                    <Button size="sm" variant="ghost" disabled={cargando === k} onClick={() => void cargarPieza(h.id, canal, true)}>
                                      <Sparkles className="w-4 h-4" /> Reescribir con IA
                                    </Button>
                                  </div>
                                  {pieza.generadaPorIA && <p className="text-xs text-[var(--ink-2)]">Escrito por la IA con el tono de tu banda. Revísalo antes de publicar.</p>}
                                </>
                              )}
                              <p className="text-xs text-[var(--ink-2)]" aria-live="polite">
                                {avisos[k]}
                              </p>
                            </div>
                          )}
                        </Card>
                      </li>
                    );
                  })}
                </ol>
              </>
            )}

            <Card tone="surface" radius="m" padding="none" className="space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm">
                  {errorListado ? (
                    <span className="text-[var(--alert)]">{errorListado}</span>
                  ) : listado ? (
                    <>
                      <span className="font-semibold tabular-nums">{listado.totales.clics}</span> clics ·{' '}
                      <span className="font-semibold tabular-nums">{listado.totales.personas}</span> personas
                      <span className="text-[var(--ink-2)]"> · últimos {listado.dias} días</span>
                    </>
                  ) : (
                    <span className="text-[var(--ink-2)]">Cargando enlaces…</span>
                  )}
                </p>
                <LinkButton tone="muted" onClick={() => setVerEnlaces((v) => !v)} aria-expanded={verEnlaces}>
                  {verEnlaces ? 'Ocultar enlaces' : 'Ver enlaces'}
                </LinkButton>
              </div>

              {listado && listado.totales.clics > 0 && <Onda data={dias} height={56} barWidth={14} gap={6} showLabels={false} animated={false} />}
              {listado?.truncado && <p className="text-xs text-[var(--ink-2)]">Hay muchos clics: las cifras son un mínimo.</p>}

              {verEnlaces && listado && (
                <div className="space-y-1.5">
                  {listado.enlaces.length === 0 && (
                    <EmptyState compact title="Todavía no has repartido ningún enlace." description="Se crean solos al preparar una publicación." />
                  )}
                  {listado.enlaces.map((e: EnlaceCorto) => (
                    <div key={e.code} className="flex items-center gap-2 py-1.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm truncate">
                          {ETIQUETA_DESTINO[e.destino] ?? e.destino} · {ETIQUETA_CANAL[e.canal] ?? e.canal}
                        </p>
                        <p className="text-xs text-[var(--ink-2)] tabular-nums">
                          {e.clics} clics · {e.personas} personas
                        </p>
                      </div>
                      <IconButton
                        label={`Copiar enlace de ${ETIQUETA_CANAL[e.canal] ?? e.canal}`}
                        size="icon-xs"
                        onClick={() => void copiarEnlace(e.url)}
                      >
                        <Copy className="w-4 h-4" />
                      </IconButton>
                      {confirmando === e.code ? (
                        <Button size="xs" variant="danger" onClick={() => void quitarEnlace(e.code)}>
                          Borrar: dejará de funcionar
                        </Button>
                      ) : (
                        <IconButton label="Borrar enlace" size="icon-xs" onClick={() => setConfirmando(e.code)}>
                          <Trash2 className="w-4 h-4" />
                        </IconButton>
                      )}
                    </div>
                  ))}
                  <p className="text-xs text-[var(--ink-2)]" aria-live="polite">
                    {avisos.enlaces}
                  </p>
                </div>
              )}

              {esPublico && (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <LinkButton onClick={() => void copiarEnlacePagina()}>
                    <Link2 className="w-4 h-4" /> Copiar enlace de la página del concierto
                  </LinkButton>
                  <span className="text-xs text-[var(--ink-2)]" aria-live="polite">
                    {avisos.pagina && (
                      <>
                        <Check className="inline w-3.5 h-3.5" /> {avisos.pagina}
                      </>
                    )}
                  </span>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
