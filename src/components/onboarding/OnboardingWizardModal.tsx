import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ChevronRight, ChevronLeft, Sparkles, Music, Send, FileText, ShieldCheck, Rocket } from 'lucide-react';

interface OnboardingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  currentBandName?: string;
}

export const OnboardingWizardModal: React.FC<OnboardingWizardModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  currentBandName = 'Mi Banda',
}) => {
  const [step, setStep] = useState(0);
  const [bandName, setBandName] = useState(currentBandName);
  const [genre, setGenre] = useState('Rock / Indie');
  const [city, setCity] = useState('Madrid, España');

  if (!isOpen) return null;

  const totalSteps = 4;

  const handleFinish = () => {
    try {
      localStorage.setItem('bandmanager_profile_wizard_completed', 'true');
    } catch (e) {
      console.warn('Error guardando bandmanager_profile_wizard_completed:', e);
    }
    if (onComplete) onComplete();
    onClose();
  };

  const steps = [
    {
      id: 'band',
      title: '1. Tu Proyecto Musical',
      subtitle: 'Configura la identidad principal de tu banda',
      icon: Music,
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Nombre de la Banda o Proyecto</label>
            <input
              type="text"
              value={bandName}
              onChange={(e) => setBandName(e.target.value)}
              placeholder="Ej: Los Vipers, Bakandeya, Alex Solo..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Género Principal</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Rock / Indie">Rock / Indie</option>
                <option value="Pop / Urbano">Pop / Urbano</option>
                <option value="Metal / Hardcore">Metal / Hardcore</option>
                <option value="Jazz / Blues">Jazz / Blues</option>
                <option value="Folk / Acústico">Folk / Acústico</option>
                <option value="Electrónica / Synth">Electrónica / Synth</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Ciudad Base</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ej: Barcelona, Sevilla..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'epk',
      title: '2. EPK & Kit de Prensa',
      subtitle: 'Tu carta de presentación oficial para salas y programadores',
      icon: FileText,
      content: (
        <div className="space-y-3">
          <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
              <Sparkles className="w-4 h-4" /> Web pública lista para compartir
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              El módulo EPK te proporciona un enlace público (/epk) profesional con tu dossier, canciones destacadas, fotos en alta resolución y rider técnico descargable.
            </p>
          </div>
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-200">
            💡 Puedes personalizar el diseño, fotos e integrantes en cualquier momento desde el módulo EPK.
          </div>
        </div>
      ),
    },
    {
      id: 'repertorio',
      title: '3. Repertorio & Modo Concierto',
      subtitle: 'Tus canciones, letras y cifrados en vivo',
      icon: Music,
      content: (
        <div className="space-y-3">
          <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <Check className="w-4 h-4" /> Transposición reactiva & Modo Escenario
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Gestiona tu catálogo de canciones con letras, acordes, BPM y estructura. Durante el directo, activa el Modo Concierto para ver los textos en pantalla gigante y cambiar de tono al instante.
            </p>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200">
            🤖 Tip: Usa la Transcripción IA para extraer los acordes automáticamente subiendo un archivo de audio o enlace.
          </div>
        </div>
      ),
    },
    {
      id: 'booking',
      title: '4. Booking IA & Seguridad Humana',
      subtitle: 'Automatiza tus giras manteniendo el control total',
      icon: Send,
      content: (
        <div className="space-y-3">
          <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4" /> Control Human-in-the-Loop
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              El Agente Scout descubre salas y genera borradores de propuesta. <strong>Ningún correo sale sin tu aprobación previa.</strong> Tú revisas, editas y apruebas cada mensaje.
            </p>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-200">
            ✉️ Puedes conectar tu propio correo no-reply o Gmail en los ajustes de la banda.
          </div>
        </div>
      ),
    },
  ];

  const currentStep = steps[step];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
                  <Rocket className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">
                  Onboarding & Bienvenida
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Bienvenido a BandManager<span className="text-blue-500">.ai</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Guía de inicio rápido para poner tu proyecto musical a punto.
            </p>

            {/* Step Indicators */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-800/60">
              {steps.map((s, idx) => (
                <div
                  key={s.id}
                  className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                    idx === step ? 'bg-amber-400' : idx < step ? 'bg-amber-500/40' : 'bg-zinc-800'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {currentStep.title}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">{currentStep.subtitle}</p>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                {currentStep.content}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 bg-zinc-950 border-t border-zinc-800">
            <button
              onClick={() => setStep(prev => Math.max(0, prev - 1))}
              disabled={step === 0}
              className={`flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-xl transition-colors ${
                step === 0 ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>

            {step < totalSteps - 1 ? (
              <button
                onClick={() => setStep(prev => Math.min(totalSteps - 1, prev + 1))}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-500/20"
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 text-xs font-extrabold rounded-xl transition-all shadow-lg shadow-amber-500/25"
              >
                ¡Comenzar ahora! <Sparkles className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const MusicianOnboardingModal = OnboardingWizardModal;
