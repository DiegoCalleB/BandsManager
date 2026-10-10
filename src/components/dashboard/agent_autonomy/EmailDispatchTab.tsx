/**
 * Pestaña de email y buzón de despacho.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { AtSign, FileEdit, Mail, Send } from "lucide-react";
import { EmailAccountConfig } from "../../EmailAccountConfig";
import { Input } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { useAgentAutonomy } from "./AgentAutonomyContext";

/**
 * Pestaña de email y buzón de despacho.
 * @returns Sección de interfaz.
 */
export function EmailDispatchTab() {
  const { activeTab, isAdmin, config, setConfig, bandName, bandId, currentUser } = useAgentAutonomy();
  return (
    <>
      {/* TAB 3: EMAIL & BUZÓN DE DESPACHO */}
      {activeTab === "email_dispatch" && (
      <div className="space-y-6">
        {/* Header Info */}
        <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--acc)]/10  text-[var(--ink-2)] text-xs flex items-start gap-3">
          <Mail className="w-5 h-5 text-[var(--ink-2)] shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <strong className="font-bold text-[var(--tentative)]">
              Configuración Central de Email para Agentes IA:
            </strong>
            <p className="text-[var(--ink-2)] text-xs">
              Aquí defines el buzón oficial y la identidad con la que
              los agentes redactarán propuestas, crearán borradores en
              Gmail y gestionarán las respuestas con las salas y
              promotores.
            </p>
          </div>
        </div>

        {/* 1. Remitente e Identidad del Agente */}
        <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-4">
          <h4 className="text-xs font-sans font-bold text-[var(--acc)] flex items-center gap-1.5">
            <AtSign className="w-4 h-4" /> 1. Remitente oficial de la
            banda para los agentes
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-sans text-[var(--ink-2)] font-semibold flex items-center justify-between">
                <span>Email del agente / remitente</span>
                <span className="text-micro text-[var(--acc)]/80 font-sans">
                  Obligatorio
                </span>
              </label>
              <Input
                size="sm"
                type="email"
                disabled={!isAdmin}
                value={config.agentSenderEmail || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    agentSenderEmail: e.target.value,
                  })
                }
                className="w-full"
                placeholder="ej: booking@tubanda.com o mibanda@gmail.com"
              />
              <p className="text-micro text-[var(--ink-2)]">
                Dirección de correo remitente que aparecerá en los
                encabezados y firma generada por la IA.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-sans text-[var(--ink-2)] font-semibold block">
                Nombre / cargo del remitente
              </label>
              <Input
                size="sm"
                type="text"
                disabled={!isAdmin}
                value={config.agentSenderName || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    agentSenderName: e.target.value,
                  })
                }
                className="w-full"
                placeholder={`ej: ${bandName} Booking & Management`}
              />
              <p className="text-micro text-[var(--ink-2)]">
                Nombre de la persona o departamento que firma las
                propuestas (ej: Booking y Management - {bandName}).
              </p>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-sans text-[var(--ink-2)] font-semibold block">
                Email de respuesta (reply-To) (opcional)
              </label>
              <Input
                size="sm"
                type="email"
                disabled={!isAdmin}
                value={config.agentReplyToEmail || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    agentReplyToEmail: e.target.value,
                  })
                }
                className="w-full"
                placeholder="ej: contacto@tubanda.com (si es diferente al remitente)"
              />
            </div>
          </div>
        </div>

        {/* 2. Conexión de la bandeja de correo (Gmail sin contraseña vía OAuth, o
 SMTP/IMAP con contraseña de aplicación para Outlook/otros) - misma
 configuración que usa el Agente Enviador programado, sin duplicar aquí
 un mecanismo de conexión distinto al de EmailAccountConfig. */}
        <EmailAccountConfig bandId={bandId || currentUser?.band_id} />

        {/* 3. Modo de Despacho de Correo */}
        <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-4">
          <h4 className="text-xs font-sans font-bold text-[var(--acc)] flex items-center gap-1.5">
            <Send className="w-4 h-4" /> 3. Modo de Despacho del Agente
            Enviador
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              type="button"
              disabled={!isAdmin}
              onClick={() =>
                setConfig({ ...config, dispatchMode: "draft_gmail" })
              }
              className={`p-4 rounded-[var(--r-m)] text-left transition-ui flex flex-col justify-between gap-3 ${
                !isAdmin
                  ? "opacity-80 cursor-default"
                  : "cursor-pointer"
              } ${
                config.dispatchMode !== "direct_send"
                  ? "bg-[var(--acc)]/20 text-[var(--ink)] ring-1 ring-[var(--acc)]/50"
                  : "bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-micro font-sans font-bold text-[var(--ok)] bg-[var(--ok)]/10 px-2 py-0.5 rounded">
                    Recomendado
                  </span>
                  <FileEdit className="w-4 h-4 text-[var(--acc)]" />
                </div>
                <h5 className="text-sm font-bold font-display text-[var(--ink)]">
                  Crear borrador en Gmail
                </h5>
                <p className="text-xs text-[var(--ink-2)] font-sans leading-snug">
                  El agente prepara el correo en la carpeta “Borradores”
                  de tu Gmail con sala, asunto, pitch y dossier adjunto.
                  Puedes abrirlo, darle tu toque y pulsar Enviar desde
                  Gmail o desde el CRM.
                </p>
              </div>
            </button>

            <button
              type="button"
              disabled={!isAdmin}
              onClick={() =>
                setConfig({ ...config, dispatchMode: "direct_send" })
              }
              className={`p-4 rounded-[var(--r-m)] text-left transition-ui flex flex-col justify-between gap-3 ${
                !isAdmin
                  ? "opacity-80 cursor-default"
                  : "cursor-pointer"
              } ${
                config.dispatchMode === "direct_send"
                  ? "bg-[var(--acc)]/20 text-[var(--ink)] ring-1 ring-[var(--acc)]/50"
                  : "bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-micro font-sans font-bold text-[var(--ink-2)] bg-[var(--acc)]/10 px-2 py-0.5 rounded">
                    Directo
                  </span>
                  <Send className="w-4 h-4 text-[var(--ink-2)]" />
                </div>
                <h5 className="text-sm font-bold font-display text-[var(--ink)]">
                  Envío directo tras aprobación
                </h5>
                <p className="text-xs text-[var(--ink-2)] font-sans leading-snug">
                  Tras pulsar “Aprobar Propuesta” o “Aprobar Respuesta” en
                  el CRM, el agente despacha el correo directamente al
                  email de la sala respetando las ventanas horarias
                  comerciales.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* 4. Control de Estado de Lectura en Bandeja (Agente Lector) */}
        <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-3">
          <h4 className="text-xs font-mono font-bold text-[var(--acc)] flex items-center gap-1.5">
            <Mail className="w-4 h-4" /> 4. Control de Estado en Bandeja
            de Entrada (Agente Lector)
          </h4>

          <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--surface)] space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                disabled={!isAdmin}
                checked={config.markAsReadInInbox || false}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    markAsReadInInbox: e.target.checked,
                  })
                }
                className="mt-0.5 rounded bg-[var(--sunken)] text-[var(--acc)] focus:ring-[var(--acc)] disabled:opacity-60"
              />
              <div className="space-y-1">
                <span className="text-xs font-bold text-[var(--ink-2)] block">
                  Marcar correos como “Leídos” en Gmail / Outlook al
                  procesarlos
                </span>
                <p className="text-xs text-[var(--ink-2)] font-sans leading-relaxed">
                  {config.markAsReadInInbox ? (
                    <span className="text-[var(--acc)]">
                      <ShowIcon inline emoji="⚠️" />Activado: El Agente Lector quitará la marca de
                      “No leído” en tu correo oficial cada vez que
                      analice un mensaje entrante.
                    </span>
                  ) : (
                    <span className="text-[var(--ok)] font-medium">
                      ✓ Desactivado (Recomendado): El Agente Lector
                      analizará y registrará las respuestas en el CRM,
                      pero{" "}
                      <strong className="text-[var(--ok)]">
                        conservará tus correos SIN LEER en tu
                        Gmail/Outlook
                      </strong>{" "}
                      para que no pierdas visibilidad ni el control de
                      tu bandeja de entrada.
                    </span>
                  )}
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>
      )}
    </>
  );
}
