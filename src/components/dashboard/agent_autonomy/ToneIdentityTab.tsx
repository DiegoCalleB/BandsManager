/**
 * Pestaña Tono e identidad (remite al ADN de tono en Gestión de Banda).
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Sparkles } from "lucide-react";
import { Button } from "../../ui";
import { useAgentAutonomy } from "./AgentAutonomyContext";

/**
 * Pestaña Tono e identidad (remite al ADN de tono en Gestión de Banda).
 * @returns Sección de interfaz.
 */
export function ToneIdentityTab() {
  const { activeTab, bandName, onOpenBandProfile, onClose, onOpenTemplatesSection } = useAgentAutonomy();
  return (
    <>
      {/* TAB 5: TONO & IDENTIDAD
 Antes esta pestaña tenía sus propios campos"Tono","Biografía" y"URL del EPK"
 que parecían configurar al Redactor pero no hacían nada real: dbUpsertAutonomyConfig
 los descartaba al guardar (ni siquiera llegaban a Supabase) y bandDna.ts - el código
 que de verdad construye los prompts de pitch/respuesta - nunca los leía. Un mánager
 podía rellenarlos de buena fe pensando que así entrenaba el tono de sus emails, sin
 ningún efecto. El tono real se entrena en ADN de Tono (BandToneModal, dentro de
 Gestión de Banda) y la biografía/EPK en la configuración del propio EPK - esta
 pestaña ahora solo señala hacia ahí en vez de duplicar una configuración fantasma. */}
      {activeTab === "tone" && (
      <div className="space-y-6">
        <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--acc)]/10 text-[var(--ink)] text-xs flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-[var(--acc)] shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <strong className="font-bold text-[var(--ink)]">
              El tono y la biografía se entrenan en Gestión de Banda
            </strong>
            <p className="text-[var(--ink-2)] text-xs">
              Para que el Agente Redactor escriba con la voz real de{" "}
              {bandName}, el tono de comunicación, vocabulario propio y
              biografía se configuran en{" "}
              <strong className="text-[var(--ink)]">ADN de Tono</strong>
              , dentro de la ficha de la banda - no aquí. Ese es el
              único sitio donde esos datos llegan de verdad a los
              pitches y respuestas generados.
            </p>
          </div>
        </div>

        {/* Enlace a ADN de Tono */}
        <div className="p-4 rounded-[var(--r-m)] bg-[var(--acc)]/10  flex items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-sans font-bold text-[var(--acc)]/70">
              ¿Quieres entrenar el tono de voz de la banda?
            </h4>
            <p className="text-xs text-[var(--ink-2)] font-sans mt-0.5">
              Analiza automáticamente vuestras redes sociales, o edita a
              mano el tono, tratamiento y vocabulario propio en ADN de
              Tono, dentro de Gestión de Banda.
            </p>
          </div>
          {onOpenBandProfile ? (
            <Button
              variant="primary"
              size="xs"
              type="button"
              onClick={() => {
                onClose();
                onOpenBandProfile();
              }}
              className="shrink-0"
            >
              Ir a Gestión de Banda ➔
            </Button>
          ) : (
            <span className="text-micro text-[var(--ink-2)] font-sans shrink-0 max-w-[160px] text-right">
              Búscalo en gestión de banda ➔ ADN de tono
            </span>
          )}
        </div>

        {/* Enlace rápido a plantillas en Booking */}
        <div className="p-4 rounded-[var(--r-m)] bg-[var(--acc)]/10  flex items-center justify-between">
          <div>
            <h4 className="text-xs font-sans font-bold text-[var(--acc)]/70">
              ¿Quieres afinar las plantillas de correo?
            </h4>
            <p className="text-xs text-[var(--ink-2)] font-sans mt-0.5">
              Puedes personalizar las plantillas específicas para Salas,
              Festivales, Discotecas y Medios desde Booking CRM.
            </p>
          </div>
          {onOpenTemplatesSection && (
            <Button
              variant="primary"
              size="xs"
              type="button"
              onClick={() => {
                onClose();
                onOpenTemplatesSection();
              }}
              className="shrink-0"
            >
              Ver Plantillas ➔
            </Button>
          )}
        </div>
      </div>
      )}
    </>
  );
}
