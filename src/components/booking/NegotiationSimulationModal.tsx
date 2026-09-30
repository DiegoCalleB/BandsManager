import React from 'react';
import { Sparkles, X, Building, Users, Loader2, Check } from 'lucide-react';
import { Lead } from '../../types';
import { ModalPortal } from '../common/ModalPortal';
import { ShowIcon } from '../ui/ShowIcon';
import { Button, Input, Select, Textarea } from '../ui';

interface PredefinedScenario {
  key: string;
  label: string;
  defaultInstruction?: string;
  customText?: string;
}

interface PredefinedScenarios {
  sala: PredefinedScenario[];
  banda: PredefinedScenario[];
}

interface NegotiationSimulationModalProps {
  isOpen: boolean;
  selectedLead: Lead | null;
  textSub: string;
  textMuted: string;
  simulationRole: 'sala' | 'banda';
  simulationScenario: string;
  simulationSenderName: string;
  simulationSubject: string;
  simulationCustomInstruction: string;
  simulationMessage: string;
  simulationGenerated: boolean;
  isGeneratingSimulation: boolean;
  predefinedScenarios: PredefinedScenarios;
  onClose: () => void;
  onRoleChange: (role: 'sala' | 'banda') => void;
  onScenarioChange: (scenarioKey: string) => void;
  onSenderNameChange: (val: string) => void;
  onSubjectChange: (val: string) => void;
  onCustomInstructionChange: (val: string) => void;
  onMessageChange: (val: string) => void;
  onGenerate: () => void;
  onCommit: () => void;
}

export function NegotiationSimulationModal({
  isOpen,
  selectedLead,
  textSub,
  textMuted,
  simulationRole,
  simulationScenario,
  simulationSenderName,
  simulationSubject,
  simulationCustomInstruction,
  simulationMessage,
  simulationGenerated,
  isGeneratingSimulation,
  predefinedScenarios,
  onClose,
  onRoleChange,
  onScenarioChange,
  onSenderNameChange,
  onSubjectChange,
  onCustomInstructionChange,
  onMessageChange,
  onGenerate,
  onCommit,
}: NegotiationSimulationModalProps) {
  if (!isOpen || !selectedLead) return null;

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/80 overflow-y-auto overscroll-contain animate-fadeIn">
        <div
          className={`w-full max-w-2xl p-5 rounded-[var(--r-l)] space-y-4 max-h-[90vh] overflow-y-auto my-auto ${'bg-[var(--surface)] text-[var(--ink)]'}`}
        >
          <div className="flex justify-between items-start pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--acc)]" />
                <h3 className="text-sm font-bold font-display">Simulador de negociación personalizado</h3>
              </div>
              <p className={`text-micro font-sans mt-0.5 ${textMuted}`}>
                Trato actual con{' '}
                <strong className="text-[var(--acc)]">{selectedLead.nombre_sala}</strong>
                {' '}({selectedLead.ciudad}) — Estado: {selectedLead.estado}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`p-1 rounded-[var(--r-pill)] transition-colors cursor-pointer hover:bg-[var(--surface)]/80 ${textSub}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="space-y-4 select-text">
            {/* Role selector buttons */}
            <div className="space-y-1.5">
              <label className={`block text-micro font-sans ${textSub}`}>¿Quién emite la respuesta simulada?</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={simulationRole === 'sala' ? "primary" : "neutral"}
                  size="sm"
                  type="button"
                  onClick={() => onRoleChange('sala')}
                  className="items-center justify-center gap-1.5"
                >
                  <Building className="w-4 h-4" /> Sala o festival (Entrante)
                </Button>
                <Button
                  variant={simulationRole === 'banda' ? "primary" : "neutral"}
                  size="sm"
                  type="button"
                  onClick={() => onRoleChange('banda')}
                  className="items-center justify-center gap-1.5"
                >
                  <Users className="w-4 h-4" /> Banda Bakandeya (Saliente)
                </Button>
              </div>
            </div>

            {/* Scenario selector */}
            <div className="space-y-1.5">
              <label className={`block text-micro font-sans ${textSub}`}>Instrucciones de situación / pauta inicial</label>
              <Select size="sm" aria-label="Instrucciones de situación / pauta inicial"
                value={simulationScenario}
                onChange={(e) => onScenarioChange(e.target.value)}
                wrapperClassName="w-full"
              >
                {(simulationRole === 'sala' ? predefinedScenarios.sala : predefinedScenarios.banda).map((sc) => (
                  <option key={sc.key} value={sc.key}>
                    {sc.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Sender Name & Subject */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={`block text-micro font-sans ${textSub}`}>Nombre del Emisor</label>
                <Input
                  size="sm"
                  type="text"
                  value={simulationSenderName}
                  onChange={(e) => onSenderNameChange(e.target.value)}
                  placeholder="Ej. Kike (Sala Hebe) o Bakandeya Agent Manager IA"
                  className="w-full"
                />
              </div>
              <div className="space-y-1.5">
                <label className={`block text-micro font-sans ${textSub}`}>Asunto del correo</label>
                <Input
                  size="sm"
                  type="text"
                  value={simulationSubject}
                  onChange={(e) => onSubjectChange(e.target.value)}
                  placeholder="Ej. Re: Propuesta…"
                  className="w-full"
                />
              </div>
            </div>

            {/* Simulation Instructions Prompt Area */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className={`block text-micro font-sans ${textSub}`}>
                  Instrucciones detalladas de negociación para la IA
                </label>
                <span className={`text-micro font-sans ${textMuted}`}>Cualquier cambio aquí personalizará el correo</span>
              </div>
              <Textarea
                rows={3}
                value={simulationCustomInstruction}
                onChange={(e) => onCustomInstructionChange(e.target.value)}
                placeholder="Define pautas específicas (ej. propone taquilla 60/40, exige rider técnico especial, etc.)…"
                className="w-full"
              />
            </div>

            {/* Generate Button */}
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={onGenerate}
                disabled={isGeneratingSimulation || !simulationCustomInstruction}
                className={`w-full py-2.5 rounded-[var(--r-s)] font-sans font-bold text-micro flex items-center justify-center gap-2 cursor-pointer transition-ui active:scale-[0.97] disabled:opacity-40 bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)]`}
              >
                {isGeneratingSimulation ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Generando Correo de Simulación…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Generar correo con Gemini AI
                  </>
                )}
              </button>
            </div>

            {/* Output Preview Area */}
            {(simulationGenerated || simulationMessage) && (
              <div className="space-y-2 pt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-between items-center">
                  <label className={`block text-micro font-sans ${'text-[var(--acc)]'}`}>
                    <ShowIcon inline emoji="✨" />Vista previa del correo generado (Editable)
                  </label>
                  <span className="text-micro font-sans bg-[var(--surface)]/15 text-[var(--ok)] px-2 py-1 rounded">
                    Listo para ajustar
                  </span>
                </div>
                <Textarea
                  rows={6}
                  value={simulationMessage}
                  onChange={(e) => onMessageChange(e.target.value)}
                  className="w-full"
                />
                <p className={`text-micro font-sans ${textMuted} leading-tight`}>
                  <ShowIcon inline emoji="💡" />Tip: Puedes retocar el texto directamente para añadir detalles personalizados específicos antes de confirmarlo.
                </p>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3.5 pt-3 mt-1">
            <button
              type="button"
              onClick={onClose}
              className={`px-2 py-1 rounded-[var(--r-pill)] font-sans text-micro transition-colors cursor-pointer bg-[var(--sunken)] hover:bg-[var(--surface)]/80 text-[var(--ink-2)]`}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onCommit}
              disabled={!simulationMessage || isGeneratingSimulation}
              className={`px-2 py-1 rounded-[var(--r-pill)] font-sans font-bold text-micro flex items-center gap-1.5 cursor-pointer shadow active:scale-[0.97] disabled:opacity-40 transition-ui bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)]`}
            >
              <Check className="w-4 h-4" /> Guardar y sincronizar
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
