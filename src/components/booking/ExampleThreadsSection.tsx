import React, { useEffect, useState, useCallback } from 'react';
import { MessageSquareText, Plus, Trash2, Loader2, Pencil } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import type { TemplateCategory } from './TemplateConfigSection';

interface ThreadMessage {
  rol: 'banda' | 'sala';
  texto: string;
  orden: number;
}

interface ExampleThread {
  id: string;
  titulo: string;
  mensajes: ThreadMessage[];
  resultado: 'positiva' | 'negativa' | 'neutral';
  created_at: string;
}

interface ExampleThreadsSectionProps {
  category: TemplateCategory;
  isStitchLight: boolean;
  textSub: string;
}

const RESULTADO_LABEL: Record<string, string> = {
  positiva: '✅ Salió bien',
  negativa: '❌ No prosperó',
  neutral: '➖ Neutro',
};

export function ExampleThreadsSection({ category, isStitchLight, textSub }: ExampleThreadsSectionProps) {
  const [threads, setThreads] = useState<ExampleThread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [resultado, setResultado] = useState<'positiva' | 'negativa' | 'neutral'>('positiva');
  const [mensajes, setMensajes] = useState<ThreadMessage[]>([
    { rol: 'banda', texto: '', orden: 0 },
    { rol: 'sala', texto: '', orden: 1 },
  ]);
  const [error, setError] = useState<string | null>(null);

  const loadThreads = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(`/api/example-threads?category=${encodeURIComponent(category)}`);
      if (res.success) setThreads(res.threads || []);
    } catch (err) {
      console.warn('No se pudieron cargar los hilos de ejemplo:', err);
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  useEffect(() => {
    loadThreads();
    setShowForm(false);
    setError(null);
  }, [loadThreads]);

  const resetForm = () => {
    setEditingId(null);
    setTitulo('');
    setResultado('positiva');
    setMensajes([
      { rol: 'banda', texto: '', orden: 0 },
      { rol: 'sala', texto: '', orden: 1 },
    ]);
  };

  const handleEdit = (thread: ExampleThread) => {
    setEditingId(thread.id);
    setTitulo(thread.titulo);
    setResultado(thread.resultado);
    setMensajes(thread.mensajes.length > 0 ? thread.mensajes : [{ rol: 'banda', texto: '', orden: 0 }]);
    setError(null);
    setShowForm(true);
  };

  const handleToggleForm = () => {
    if (showForm) {
      resetForm();
      setShowForm(false);
    } else {
      resetForm();
      setShowForm(true);
    }
  };

  const handleAddMessageRow = () => {
    setMensajes((prev) => {
      const ultimoRol = prev[prev.length - 1]?.rol;
      const nuevoRol: 'banda' | 'sala' = ultimoRol === 'banda' ? 'sala' : 'banda';
      return [...prev, { rol: nuevoRol, texto: '', orden: prev.length }];
    });
  };

  const handleRemoveMessageRow = (idx: number) => {
    setMensajes((prev) => prev.filter((_, i) => i !== idx).map((m, i) => ({ ...m, orden: i })));
  };

  const handleMessageChange = (idx: number, field: 'rol' | 'texto', value: string) => {
    setMensajes((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  };

  const handleSave = async () => {
    setError(null);
    const mensajesConTexto = mensajes.filter((m) => m.texto.trim());
    if (mensajesConTexto.length === 0) {
      setError('Añade al menos un mensaje con texto.');
      return;
    }
    setIsSaving(true);
    try {
      const res = editingId
        ? await apiFetch(`/api/example-threads/${editingId}`, {
            method: 'PUT',
            body: JSON.stringify({ titulo, mensajes: mensajesConTexto, resultado }),
          })
        : await apiFetch('/api/example-threads', {
            method: 'POST',
            body: JSON.stringify({ category, titulo, mensajes: mensajesConTexto, resultado }),
          });
      if (res.success) {
        resetForm();
        setShowForm(false);
        await loadThreads();
      } else {
        setError(res.error || 'No se pudo guardar el hilo.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar el hilo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/example-threads/${id}`, { method: 'DELETE' });
      setThreads((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.warn('No se pudo borrar el hilo:', err);
    }
  };

  return (
    <div className="space-y-3 p-3.5 rounded-[var(--r-m)] bg-sky-500/5">
      <div className="flex items-center justify-between">
        <label className="block text-[10px] uppercase font-sans font-bold tracking-wider text-sky-300 flex items-center gap-1.5">
          <MessageSquareText className="w-3.5 h-3.5 text-sky-400" /> Hilos de Email Reales de Ejemplo
        </label>
        <button
          type="button"
          onClick={handleToggleForm}
          className="text-[9px] font-bold text-sky-400 hover:underline cursor-pointer flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> {showForm ? 'Cancelar' : 'Pegar un hilo'}
        </button>
      </div>

      <p className="text-[9px] text-sky-300/70 font-sans leading-tight">
        Pega conversaciones reales (nuestro mensaje + la respuesta de la sala/medio, y si la hubo, nuestra respuesta a esa respuesta) para esta categoría. Se usan como ejemplo real tanto al redactar el primer contacto como al generar respuestas a negociaciones.
      </p>

      {isLoading ? (
        <div className="text-[10px] text-sky-300/70 flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Cargando hilos...</div>
      ) : threads.length > 0 ? (
        <div className="space-y-1.5">
          {threads.map((t) => (
            <div
              key={t.id}
              onClick={() => handleEdit(t)}
              className="flex items-center justify-between p-2 rounded-[var(--r-s)] bg-[var(--surface)] text-[10px] cursor-pointer hover:border-sky-500/40 transition-colors"
              title="Abrir para ver o editar este hilo"
            >
              <div className="min-w-0">
                <span className="font-bold text-bg-[var(--sunken)]">{t.titulo || 'Sin título'}</span>
                <span className="text-neutral-500 ml-2">{t.mensajes.length} mensaje(s) · {RESULTADO_LABEL[t.resultado] || t.resultado}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleEdit(t); }}
                  className="p-1 text-neutral-500 hover:text-sky-400 cursor-pointer"
                  title="Ver / editar este hilo"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                  className="p-1 text-neutral-500 hover:text-red-400 cursor-pointer"
                  title="Borrar este hilo de ejemplo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-[10px] text-sky-300/50 italic">Todavía no hay hilos de ejemplo guardados para esta categoría.</div>
      )}

      {showForm && (
        <div className="space-y-2.5 pt-2 border-t border-sky-500/20">
          {editingId && (
            <div className="text-[9px] text-sky-400 font-sans font-bold">Editando hilo guardado</div>
          )}
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título del ejemplo (ej: Sala Apolo, negociación de fecha)"
            className={`w-full rounded-[var(--r-s)] px-2 py-1.5 text-[10px] focus:outline-none font-sans ${isStitchLight ? 'bg-white text-[var(--ink)]' : 'bg-[var(--surface)] text-[var(--ink)]'}`}
          />

          {mensajes.map((m, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <select
                value={m.rol}
                onChange={(e) => handleMessageChange(idx, 'rol', e.target.value)}
                className="text-[9px] rounded-[var(--r-s)] px-1.5 py-1.5 bg-[var(--surface)] text-neutral-300 shrink-0"
              >
                <option value="banda">Banda</option>
                <option value="sala">Sala</option>
              </select>
              <textarea
                rows={2}
                value={m.texto}
                onChange={(e) => handleMessageChange(idx, 'texto', e.target.value)}
                placeholder={m.rol === 'banda' ? 'Lo que escribimos nosotros...' : 'Lo que respondió la sala...'}
                className={`flex-1 rounded-[var(--r-s)] p-2 text-[10px] focus:outline-none font-sans leading-relaxed ${isStitchLight ? 'bg-white text-[var(--ink)]' : 'bg-[var(--surface)] text-[var(--ink)]'}`}
              />
              {mensajes.length > 1 && (
                <button type="button" onClick={() => handleRemoveMessageRow(idx)} className="p-1 text-neutral-500 hover:text-red-400 cursor-pointer shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddMessageRow}
            className="text-[9px] font-bold text-sky-400 hover:underline cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Añadir mensaje al hilo
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[9px] text-text-[var(--ink-2)] font-sans">Resultado:</span>
            {(['positiva', 'neutral', 'negativa'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setResultado(r)}
                className={`text-[9px] px-2 py-1 rounded-[var(--r-s)] font-sans cursor-pointer ${resultado === r ? 'bg-sky-500/30 text-sky-200 font-bold' : 'bg-[var(--surface)] text-neutral-500'}`}
              >
                {RESULTADO_LABEL[r]}
              </button>
            ))}
          </div>

          {error && <div className="text-[9px] text-red-400 font-sans">{error}</div>}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-1.5 px-3 bg-sky-500 hover:bg-sky-400 text-black font-bold text-[10px] rounded-[var(--r-s)] flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{isSaving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Guardar hilo de ejemplo'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
