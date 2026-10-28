import React, { useState } from 'react';
import { Button, Field, Input, Select, Textarea } from '../ui';
import {
  CAMARAS, ETAPAS, ETIQUETA_CAMARA, ETIQUETA_ETAPA, ETIQUETA_OBJETIVO, HORAS, MAX_PILARES, OBJETIVOS,
  sanearEstrategia, type EstrategiaMarketing, type HorasSemana,
} from '../../utils/asesor/estrategia';

interface Props {
  inicial: EstrategiaMarketing;
  guardando: boolean;
  sugiriendo: boolean;
  onGuardar: (e: EstrategiaMarketing) => Promise<boolean>;
  onProponer: () => Promise<EstrategiaMarketing | null>;
}

/** "rock de barrio, la furgo" → ['rock de barrio', 'la furgo']. El saneador recorta y deduplica. */
const aLista = (s: string) => s.split(/[,\n]/).map((x) => x.trim()).filter(Boolean);

const HORAS_ETIQUETA: Record<HorasSemana, string> = { 1: '1 h', 3: '3 h', 6: '6 h o más' };

/**
 * La estrategia de la banda: lo que hace que el asesor no proponga lo mismo a todo el mundo.
 * La IA puede rellenar un borrador, pero solo se guarda lo que la banda confirma.
 */
export function FormEstrategia({ inicial, guardando, sugiriendo, onGuardar, onProponer }: Props) {
  const [e, setE] = useState(inicial);
  const [pilares, setPilares] = useState<string[]>(() => [...inicial.pilares, '', '', ''].slice(0, MAX_PILARES));
  const [lineasRojas, setLineasRojas] = useState(inicial.lineasRojas.join(', '));
  const [referentes, setReferentes] = useState(inicial.referentes.join(', '));
  const [guardado, setGuardado] = useState(false);

  const cargar = (x: EstrategiaMarketing) => {
    setE(x);
    setPilares([...x.pilares, '', '', ''].slice(0, MAX_PILARES));
    setLineasRojas(x.lineasRojas.join(', '));
    setReferentes(x.referentes.join(', '));
  };

  const poner = <K extends keyof EstrategiaMarketing>(k: K, v: EstrategiaMarketing[K]) => {
    setGuardado(false);
    setE((prev) => ({ ...prev, [k]: v }));
  };

  const proponer = async () => {
    const borrador = await onProponer();
    // Las líneas rojas y el lanzamiento son de la banda: el borrador no los pisa.
    if (borrador) cargar({ ...borrador, lineasRojas: aLista(lineasRojas), lanzamiento: e.lanzamiento });
  };

  const guardar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const limpia = sanearEstrategia({ ...e, pilares, lineasRojas: aLista(lineasRojas), referentes: aLista(referentes) });
    if (limpia) setGuardado(await onGuardar(limpia));
  };

  const lanz = e.lanzamiento ?? { titulo: '', fecha: '' };
  const ponerLanzamiento = (cambio: Partial<typeof lanz>) => {
    const siguiente = { ...lanz, ...cambio };
    poner('lanzamiento', siguiente.titulo || siguiente.fecha ? siguiente : null);
  };

  return (
    <form onSubmit={guardar} className="grid gap-4">
      {!inicial.revisada && (
        <div className="flex flex-wrap items-center gap-3 rounded-[var(--r-m)] bg-[var(--acc-soft)] p-4 text-sm text-[var(--acc-ink)]">
          <p className="min-w-0 flex-1">Con lo que ya sabemos de vosotros podemos rellenar un borrador. Luego lo corregís.</p>
          <Button type="button" size="sm" variant="raised" onClick={proponer} disabled={sugiriendo}>
            {sugiriendo ? 'Pensando…' : 'Proponer borrador'}
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="¿Qué queréis conseguir?">
          <Select value={e.objetivo} onChange={(ev) => poner('objetivo', ev.target.value as EstrategiaMarketing['objetivo'])}>
            {OBJETIVOS.map((o) => <option key={o} value={o}>{ETIQUETA_OBJETIVO[o]}</option>)}
          </Select>
        </Field>
        <Field label="¿Dónde estáis ahora?">
          <Select value={e.etapa} onChange={(ev) => poner('etapa', ev.target.value as EstrategiaMarketing['etapa'])}>
            {ETAPAS.map((o) => <option key={o} value={o}>{ETIQUETA_ETAPA[o]}</option>)}
          </Select>
        </Field>
      </div>

      <Field label="¿A quién le habláis?" hint="Edad, qué escucha, por dónde sale.">
        <Textarea rows={2} value={e.publico} maxLength={300} onChange={(ev) => poner('publico', ev.target.value)} />
      </Field>

      <Field label="Tiempo real para redes, a la semana">
        <div className="flex gap-1 rounded-[var(--r-pill)] bg-[var(--sunken)] p-1" role="radiogroup" aria-label="Horas a la semana">
          {HORAS.map((h) => (
            <Button key={h} type="button" size="sm" role="radio" aria-checked={e.horasSemana === h}
              variant={e.horasSemana === h ? 'selected' : 'ghost'} className="flex-1" onClick={() => poner('horasSemana', h)}>
              {HORAS_ETIQUETA[h]}
            </Button>
          ))}
        </div>
      </Field>

      <Field label="¿Quién sale hablando a cámara?">
        <Select value={e.camara} onChange={(ev) => poner('camara', ev.target.value as EstrategiaMarketing['camara'])}>
          {CAMARAS.map((o) => <option key={o} value={o}>{ETIQUETA_CAMARA[o]}</option>)}
        </Select>
      </Field>

      <Field label="Vuestros tres temas" hint="De lo que siempre podéis hablar: «ensayos caóticos», «la furgo», «de dónde salen las letras».">
        <div className="grid gap-2">
          {pilares.map((p, i) => (
            <Input key={i} value={p} maxLength={140} aria-label={`Tema ${i + 1}`}
              onChange={(ev) => { setGuardado(false); setPilares((prev) => prev.map((x, j) => (j === i ? ev.target.value : x))); }} />
          ))}
        </div>
      </Field>

      <Field label="Lo que no haríais nunca" hint="Separado por comas. El asesor no os lo propondrá." optional>
        <Input value={lineasRojas} onChange={(ev) => { setGuardado(false); setLineasRojas(ev.target.value); }} placeholder="bailes de trends, política" />
      </Field>

      <Field label="Bandas cuyas redes os gustan" hint="Separado por comas, hasta tres." optional>
        <Input value={referentes} onChange={(ev) => { setGuardado(false); setReferentes(ev.target.value); }} />
      </Field>

      <Field label="Próximo lanzamiento" hint="Si sacáis single o disco, el asesor prepara el estreno." optional>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_11rem]">
          <Input value={lanz.titulo} maxLength={140} placeholder="Título" aria-label="Título del lanzamiento" onChange={(ev) => ponerLanzamiento({ titulo: ev.target.value })} />
          <Input type="date" value={lanz.fecha} aria-label="Fecha del lanzamiento" onChange={(ev) => ponerLanzamiento({ fecha: ev.target.value })} />
        </div>
      </Field>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar estrategia'}</Button>
        {guardado && <span className="text-sm text-[var(--ink-2)]">Guardada. El plan de hoy ya la tiene en cuenta.</span>}
      </div>
    </form>
  );
}
