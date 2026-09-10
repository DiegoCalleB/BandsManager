import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, CheckCircle2, Sparkles, BookOpen, Music, Send, FileText, Mic, Users } from 'lucide-react';
import { ModuleTutorialContent } from '../../hooks/useModuleTutorial';

export const TUTORIAL_DATA: Record<string, ModuleTutorialContent> = {
  booking: {
    moduleId: 'booking',
    moduleTitle: 'Guía Rápida: Booking CRM & Agentes IA',
    badge: 'Módulo de Booking',
    steps: [
      {
        title: '1. Agente Scout: Descubre Salas',
        description: 'El Scout busca y enriquece automáticamente salas de conciertos y festivales afines a tu género musical con datos de contacto verificados.',
        tip: 'Usa los filtros por ciudad y capacidad para afinar tu búsqueda.',
        icon: 'Send'
      },
      {
        title: '2. Generación de Pitches Personalizados',
        description: 'La IA analiza la identidad de tu banda (Tone DNA) y crea redactados profesionales adaptados a cada sala.',
        tip: 'Revisa siempre la caché o mínimo garantizado antes de solicitar propuesta.',
        icon: 'Sparkles'
      },
      {
        title: '3. Aprobación Humana (Human-in-the-Loop)',
        description: 'Los correos NUNCA se envían sin tu autorización. Revisa el borrador, edita lo que quieras y pulsa "Aprobar" para despachar.',
        tip: 'Puedes configurar tu cuenta de correo en Ajustes para enviar desde tu propio email.',
        icon: 'CheckCircle2'
      }
    ]
  },
  repertorio: {
    moduleId: 'repertorio',
    moduleTitle: 'Guía Rápida: Repertorio, Acordes & Setlists',
    badge: 'Módulo de Música',
    steps: [
      {
        title: '1. Catálogo & Acordes reactivos',
        description: 'Organiza todas tus canciones con tonalidad, BPM, estructura y letras. Traspon acordes en tiempo real para adaptarlos a tu voz.',
        tip: 'Formatos soportados en letras: [Am]Texto para cifrado americano automático.',
        icon: 'Music'
      },
      {
        title: '2. Transcripción por IA',
        description: 'Sube un archivo de audio o pega un enlace para que la IA extraiga la estructura, acordes sugeridos y tempo automáticamente.',
        tip: 'Puedes validar los acordes sugeridos antes de guardarlos en el catálogo.',
        icon: 'Sparkles'
      },
      {
        title: '3. Modo Concierto & Escenario',
        description: 'Crea Setlists ordenados y activa el Modo Concierto con vista limpia sin distracciones, cambio de tono y pedalera bluetooth.',
        tip: 'Usa el botón de pantalla completa para ver la letra a gran tamaño en el escenario.',
        icon: 'BookOpen'
      }
    ]
  },
  epk: {
    moduleId: 'epk',
    moduleTitle: 'Guía Rápida: EPK & Dossier de Prensa',
    badge: 'Kit de Prensa',
    steps: [
      {
        title: '1. Tu Web Pública de Banda',
        description: 'El EPK genera una web pública elegante orientada a la contratación para salas, festivales y prensa.',
        tip: 'Comparte tu enlace /epk directo en propuestas o redes sociales.',
        icon: 'FileText'
      },
      {
        title: '2. Formación, Rider & Pistas',
        description: 'Configura tus temas destacados, formación de integrantes, fotos en alta resolución y rider técnico descargable.',
        tip: 'Añade el enlace de Spotify o YouTube para que los programadores escuchen tu música.',
        icon: 'Sparkles'
      }
    ]
  },
  studio: {
    moduleId: 'studio',
    moduleTitle: 'Guía Rápida: AI Sound Studio & DAW',
    badge: 'Estudio Virtual',
    steps: [
      {
        title: '1. Grabación Multipista & Panning',
        description: 'Graba pistas de audio directamente desde el navegador con ajuste de latencia, panning estéreo e inspección de picos.',
        tip: 'Usa presets de latencia (PC, Móvil, Bluetooth) para una sincronía perfecta.',
        icon: 'Mic'
      },
      {
        title: '2. Claqueta & Mezcla Master',
        description: 'Activa la claqueta de entrada (Count-in 4 beeps), ajusta EQ de 3 bandas por pista y exporta la mezcla final en WAV.',
        tip: 'Normaliza los picos de mezcla a -1dBFS antes de exportar.',
        icon: 'Sparkles'
      }
    ]
  },
  fans: {
    moduleId: 'fans',
    moduleTitle: 'Guía Rápida: Captación de Fans & QR Conciertos',
    badge: 'Comunidad de Fans',
    steps: [
      {
        title: '1. QR Dinámico para Conciertos',
        description: 'Genera códigos QR personalizados para proyectar en el escenario o imprimir en carteles durante tus directos.',
        tip: 'Los fans escanean el QR y acceden al formulario público "Únete".',
        icon: 'Users'
      },
      {
        title: '2. Fidelización & Regalo de Bienvenida',
        description: 'Configura incentivos automáticos (descuentos de merch, descargas de temas inéditos o pegatinas de bienvenida).',
        tip: 'Exporta tu base de fans en Excel cuando quieras.',
        icon: 'Sparkles'
      }
    ]
  }
};

interface ModuleTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
}

export const ModuleTutorialModal: React.FC<ModuleTutorialModalProps> = ({ isOpen, onClose, moduleId }) => {
  const tutorial = TUTORIAL_DATA[moduleId] || TUTORIAL_DATA.booking;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = tutorial.steps[currentStepIndex] || tutorial.steps[0];
  const isLastStep = currentStepIndex === tutorial.steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
      setCurrentStepIndex(0);
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStepIndex(prev => Math.max(0, prev - 1));
  };

  const renderIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Sparkles': return <Sparkles className="w-6 h-6 text-amber-400" />;
      case 'Music': return <Music className="w-6 h-6 text-blue-400" />;
      case 'Send': return <Send className="w-6 h-6 text-emerald-400" />;
      case 'FileText': return <FileText className="w-6 h-6 text-purple-400" />;
      case 'Mic': return <Mic className="w-6 h-6 text-rose-400" />;
      case 'Users': return <Users className="w-6 h-6 text-cyan-400" />;
      default: return <BookOpen className="w-6 h-6 text-amber-400" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                {renderIcon(currentStep.icon)}
              </div>
              <div>
                <span className="text-[11px] font-semibold text-amber-400 tracking-wider uppercase">
                  {tutorial.badge || 'Guía Rápida'}
                </span>
                <h3 className="text-base font-bold text-white leading-tight">
                  {tutorial.moduleTitle}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-zinc-400 font-medium">
                Paso {currentStepIndex + 1} de {tutorial.steps.length}
              </span>
              <div className="flex gap-1.5">
                {tutorial.steps.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentStepIndex ? 'w-6 bg-amber-400' : 'w-2 bg-zinc-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStepIndex}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <h4 className="text-lg font-semibold text-zinc-100">
                  {currentStep.title}
                </h4>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {currentStep.description}
                </p>

                {currentStep.tip && (
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Consejo:</strong> {currentStep.tip}</span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 bg-zinc-950/80 border-t border-zinc-800">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className={`flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                currentStepIndex === 0
                  ? 'text-zinc-600 cursor-not-allowed'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-500/20"
            >
              {isLastStep ? (
                <>Entendido <CheckCircle2 className="w-4 h-4" /></>
              ) : (
                <>Siguiente <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
