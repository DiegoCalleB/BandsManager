import React, { useState } from 'react';
import { X, Loader, AlertCircle, Brain, TrendingUp, Zap } from 'lucide-react';
import { api } from '../../services/api';

interface SetlistAIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  setlistId: string;
  setlistName?: string;
}

interface Suggestion {
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  issue: string;
  suggestion: string;
  impact: string;
  songs_involved?: string[];
}

interface Analysis {
  narrativeArc: string;
  psychologicalFlow: string;
  suggestions: Suggestion[];
  overallScore: number;
  strengths: string[];
  areasForImprovement: string[];
}

export function SetlistAIAnalysisModal({ isOpen, onClose, setlistId, setlistName }: SetlistAIAnalysisModalProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.analyzeSetlistWithAI(setlistId);
      if (result.success && result.analysis) {
        setAnalysis(result.analysis);
      } else {
        setError(result.error || 'Error al analizar el setlist');
      }
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟠';
      case 'low': return '🟡';
      default: return '⚪';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pacing': return '⏱️';
      case 'narrative': return '📖';
      case 'psychology': return '🧠';
      case 'recovery': return '💨';
      case 'contrast': return '⚡';
      default: return '📌';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-neutral-700">
        {/* Header */}
        <div className="sticky top-0 bg-neutral-900 border-b border-neutral-700 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-purple-400" />
            <div>
              <h2 className="text-xl font-bold">Análisis Avanzado con IA</h2>
              {setlistName && <p className="text-sm text-neutral-400">{setlistName}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!analysis && !loading && !error && (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-purple-400/50 mx-auto mb-4" />
              <p className="text-neutral-300 mb-6">
                Haz un análisis profundo de tu setlist con IA. Te daremos sugerencias personalizadas sobre pacing, narrativa y psicología del público.
              </p>
              <button
                onClick={handleAnalyze}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition font-medium"
              >
                Iniciar Análisis IA
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <Loader className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
              <p className="text-neutral-400">Analizando tu setlist...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-200">Error</p>
                <p className="text-sm text-red-300">{error}</p>
                <button
                  onClick={handleAnalyze}
                  className="mt-3 text-sm text-red-300 hover:text-red-200 underline"
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {analysis && (
            <div className="space-y-6">
              {/* Score */}
              <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-neutral-300 font-medium">Score General</span>
                  <span className="text-2xl font-bold text-purple-400">{analysis.overallScore}/100</span>
                </div>
                <div className="w-full bg-neutral-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-purple-400 h-2 rounded-full transition-all"
                    style={{ width: `${analysis.overallScore}%` }}
                  />
                </div>
              </div>

              {/* Narrative Arc */}
              <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
                <p className="text-sm text-neutral-400 mb-2">📖 Arco Narrativo</p>
                <p className="text-neutral-200">{analysis.narrativeArc}</p>
              </div>

              {/* Psychological Flow */}
              <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
                <p className="text-sm text-neutral-400 mb-2">🧠 Flujo Psicológico</p>
                <p className="text-neutral-200">{analysis.psychologicalFlow}</p>
              </div>

              {/* Strengths */}
              {analysis.strengths.length > 0 && (
                <div className="bg-green-900/20 rounded-lg p-4 border border-green-700">
                  <p className="text-sm font-medium text-green-300 mb-2">✓ Fortalezas</p>
                  <ul className="space-y-1">
                    {analysis.strengths.map((strength, idx) => (
                      <li key={idx} className="text-sm text-green-200">• {strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              <div>
                <h3 className="font-semibold text-neutral-200 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  Sugerencias ({analysis.suggestions.length})
                </h3>
                <div className="space-y-3">
                  {analysis.suggestions.map((sugg, idx) => (
                    <div
                      key={idx}
                      className="bg-neutral-800 rounded-lg p-4 border border-neutral-700 hover:border-neutral-600 transition"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <span className="text-lg">{getPriorityIcon(sugg.priority)}</span>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-neutral-100">{sugg.title}</p>
                              <p className="text-xs text-neutral-500 mt-1">
                                {getCategoryIcon(sugg.category)} {sugg.category}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm ml-8">
                        <div>
                          <p className="text-neutral-400">🔍 Problema:</p>
                          <p className="text-neutral-300">{sugg.issue}</p>
                        </div>
                        <div>
                          <p className="text-neutral-400">💡 Sugerencia:</p>
                          <p className="text-neutral-200 font-medium">{sugg.suggestion}</p>
                        </div>
                        <div>
                          <p className="text-neutral-400">⭐ Impacto:</p>
                          <p className="text-neutral-300">{sugg.impact}</p>
                        </div>
                        {sugg.songs_involved && sugg.songs_involved.length > 0 && (
                          <div>
                            <p className="text-neutral-400">🎵 Canciones:</p>
                            <p className="text-neutral-300">{sugg.songs_involved.join(', ')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Areas for Improvement */}
              {analysis.areasForImprovement.length > 0 && (
                <div className="bg-amber-900/20 rounded-lg p-4 border border-amber-700">
                  <p className="text-sm font-medium text-amber-300 mb-2">🎯 Áreas de Mejora</p>
                  <ul className="space-y-1">
                    {analysis.areasForImprovement.map((area, idx) => (
                      <li key={idx} className="text-sm text-amber-200">• {area}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAnalyze}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition font-medium text-sm"
                >
                  🔄 Re-analizar
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded-lg transition font-medium text-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
