import React from 'react';
import { Award, Plus, Trash2, Radio, Users, CheckCircle2, TrendingUp } from 'lucide-react';
import { PressQuoteItem } from '../types';

interface StepPressProofProps {
  pressQuotes: PressQuoteItem[];
  newQuoteText: string;
  setNewQuoteText: (v: string) => void;
  newQuoteMedia: string;
  setNewQuoteMedia: (v: string) => void;
  onAddQuote: () => void;
  onRemoveQuote: (id: string) => void;
  festivalesDestacados: string;
  setFestivalesDestacados: (v: string) => void;
  cifrasOyentes: string;
  setCifrasOyentes: (v: string) => void;
  cifrasDirectos: string;
  setCifrasDirectos: (v: string) => void;
  cifrasComunidad: string;
  setCifrasComunidad: (v: string) => void;
}

export const StepPressProof: React.FC<StepPressProofProps> = ({
  pressQuotes,
  newQuoteText,
  setNewQuoteText,
  newQuoteMedia,
  setNewQuoteMedia,
  onAddQuote,
  onRemoveQuote,
  festivalesDestacados,
  setFestivalesDestacados,
  cifrasOyentes,
  setCifrasOyentes,
  cifrasDirectos,
  setCifrasDirectos,
  cifrasComunidad,
  setCifrasComunidad,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-2 pb-2">
        <Award className="w-5 h-5 text-[var(--acc)]" />
        <h3 className="text-base font-semibold text-[var(--ink)]">Hitos, Reseñas de Prensa y Social Proof</h3>
      </div>

      <p className="text-xs text-[var(--ink-2)]">
        Las menciones de medios y festivales generan credibilidad inmediata ante programadores y agencias de booking.
      </p>

      {/* Cifras Clave de Impacto */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1">
          <label className="block text-xs font-medium text-[var(--ink-2)] flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-[var(--ok)]" /> Oyentes Mensuales Spotify
          </label>
          <input
            type="text"
            value={cifrasOyentes}
            onChange={(e) => setCifrasOyentes(e.target.value)}
            placeholder="Ej. 12.500 oyentes / mes"
            className="w-full px-2.5 py-1.5 rounded-[var(--r-s)] bg-[var(--sunken)] text-[var(--ink)] text-xs focus:outline-none"
          />
        </div>

        <div className="p-3 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1">
          <label className="block text-xs font-medium text-[var(--ink-2)] flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-[var(--acc)]" /> Conciertos Realizados
          </label>
          <input
            type="text"
            value={cifrasDirectos}
            onChange={(e) => setCifrasDirectos(e.target.value)}
            placeholder="Ej. +35 directos en 2025"
            className="w-full px-2.5 py-1.5 rounded-[var(--r-s)] bg-[var(--sunken)] text-[var(--ink)] text-xs focus:outline-none"
          />
        </div>

        <div className="p-3 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1">
          <label className="block text-xs font-medium text-[var(--ink-2)] flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-[var(--alert)]" /> Comunidad / seguidores
          </label>
          <input
            type="text"
            value={cifrasComunidad}
            onChange={(e) => setCifrasComunidad(e.target.value)}
            placeholder="Ej. +4.800 en Instagram & TikTok"
            className="w-full px-2.5 py-1.5 rounded-[var(--r-s)] bg-[var(--sunken)] text-[var(--ink)] text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* Festivales & Salas donde han tocado */}
      <div>
        <label className="block text-xs font-medium text-[var(--ink-2)] mb-1.5">Festivales, Salas o Concursos Destacados</label>
        <input
          type="text"
          value={festivalesDestacados}
          onChange={(e) => setFestivalesDestacados(e.target.value)}
          placeholder="Ej. Sonorama Ribera 2024, Sala Sol (Madrid), Finalistas Villa de Madrid, Monkey Week…"
          className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[var(--surface)] text-[var(--ink)] placeholder-[var(--ink-2)] text-xs focus:outline-none"
        />
      </div>

      {/* Reseñas / Citas de Prensa */}
      <div className="pt-2 space-y-3">
        <h4 className="text-xs font-semibold text-[var(--ink-2)]">Citas y Reseñas de Medios de Comunicación</h4>

        {pressQuotes.length > 0 && (
          <div className="space-y-2">
            {pressQuotes.map((q) => (
              <div key={q.id} className="flex items-start justify-between p-3 rounded-[var(--r-m)] bg-[var(--surface)] text-xs">
                <div>
                  <p className="text-[var(--ink)] italic mb-1">"{q.texto}"</p>
                  <span className="text-[var(--acc)] font-semibold">— {q.medio}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveQuote(q.id)}
                  className="p-1 rounded text-[var(--ink-2)] hover:text-[var(--alert)]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="p-3 rounded-[var(--r-m)] bg-[var(--surface)] space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2">
              <input
                type="text"
                value={newQuoteText}
                onChange={(e) => setNewQuoteText(e.target.value)}
                placeholder="Cita destacada (ej. Una de las propuestas más frescas del año…)"
                className="w-full px-3 py-1.5 rounded-[var(--r-s)] bg-[var(--bg)] text-[var(--ink)] placeholder-[var(--ink-2)] text-xs focus:outline-none"
              />
            </div>
            <div>
              <input
                type="text"
                value={newQuoteMedia}
                onChange={(e) => setNewQuoteMedia(e.target.value)}
                placeholder="Medio (ej. MondoSonoro, Radio 3)"
                className="w-full px-3 py-1.5 rounded-[var(--r-s)] bg-[var(--bg)] text-[var(--ink)] placeholder-[var(--ink-2)] text-xs focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onAddQuote}
              disabled={!newQuoteText.trim() || !newQuoteMedia.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--r-pill)] bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] font-semibold text-xs transition-colors disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" /> Añadir cita
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
