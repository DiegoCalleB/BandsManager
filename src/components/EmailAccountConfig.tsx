import React, { useState, useEffect } from "react";
import {
  Mail,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
  KeyRound,
  RefreshCw,
  Sparkles,
  Unlink,
} from "lucide-react";
import { api } from "../services/api";
import { BandEmailAccountStatus } from "../types";

interface EmailAccountConfigProps {
  bandId: string;
}

type Provider = "gmail" | "outlook" | "other";

// Host/puerto conocidos por proveedor - la banda no tiene que buscarlos.'other' se rellena
// a mano (dominio propio / cualquier hosting de correo).
const PROVIDER_PRESETS: Record<
  Exclude<Provider, "other">,
  {
    smtp_host: string;
    smtp_port: number;
    smtp_secure: boolean;
    imap_host: string;
    imap_port: number;
    label: string;
    helpUrl: string;
  }
> = {
  gmail: {
    smtp_host: "smtp.gmail.com",
    smtp_port: 465,
    smtp_secure: true,
    imap_host: "imap.gmail.com",
    imap_port: 993,
    label: "Gmail",
    helpUrl: "https://support.google.com/accounts/answer/185833",
  },
  outlook: {
    smtp_host: "smtp.office365.com",
    smtp_port: 587,
    smtp_secure: false,
    imap_host: "outlook.office365.com",
    imap_port: 993,
    label: "Outlook / Microsoft 365",
    helpUrl:
      "https://support.microsoft.com/es-es/account-billing/usar-contrase%C3%B1as-de-aplicaci%C3%B3n-en-cuentas-de-microsoft-como-la-autenticaci%C3%B3n-en-dos-pasos-e5e4e6f9-2c4a-4a5b-9a3f-0d2b2a0c8b6a",
  },
};

export const EmailAccountConfig: React.FC<EmailAccountConfigProps> = ({
  bandId,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [status, setStatus] = useState<BandEmailAccountStatus>({
    connected: false,
  });
  const [editing, setEditing] = useState<boolean>(false);

  const [provider, setProvider] = useState<Provider>("gmail");
  const [email, setEmail] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState<number>(465);
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [imapHost, setImapHost] = useState("");
  const [imapPort, setImapPort] = useState<number>(993);

  // Gmail conectado por OAuth (sin contraseña de aplicación ni popup para el Agente Enviador
  // programado - ver server/routes/gmailOAuth.ts). Independiente del formulario IMAP de
  // arriba: una banda puede tener las dos cosas, ninguna, o solo una.
  const [gmailOAuthStatus, setGmailOAuthStatus] = useState<{
    connected: boolean;
    gmail_email?: string;
  }>({ connected: false });
  const [gmailOAuthLoading, setGmailOAuthLoading] = useState(true);
  const [gmailOAuthConnecting, setGmailOAuthConnecting] = useState(false);
  const [gmailOAuthDisconnecting, setGmailOAuthDisconnecting] = useState(false);
  const [gmailOAuthFeedback, setGmailOAuthFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!bandId) return;
    let isMounted = true;
    const fetchGmailOAuthStatus = async () => {
      setGmailOAuthLoading(true);
      try {
        const data = await api.getGmailOAuthStatus();
        if (isMounted) setGmailOAuthStatus(data || { connected: false });
      } catch (err) {
        console.error("Error consultando el estado de Gmail OAuth:", err);
        if (isMounted) setGmailOAuthStatus({ connected: false });
      } finally {
        if (isMounted) setGmailOAuthLoading(false);
      }
    };
    fetchGmailOAuthStatus();
    return () => {
      isMounted = false;
    };
  }, [bandId]);

  // El callback del servidor (server/routes/gmailOAuth.ts) redirige de vuelta con
  // ?gmail_oauth=conectado|error tras completar (o fallar) el consentimiento en Google.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resultado = params.get("gmail_oauth");
    if (!resultado) return;

    if (resultado === "conectado") {
      setGmailOAuthFeedback({
        type: "success",
        message:
          "¡Gmail conectado! El Agente Enviador ya puede crear borradores sin pedir contraseña.",
      });
      api
        .getGmailOAuthStatus()
        .then((data) => setGmailOAuthStatus(data || { connected: false }))
        .catch(() => {});
    } else {
      const motivo = params.get("motivo") || "error_desconocido";
      setGmailOAuthFeedback({
        type: "error",
        message: `No se pudo conectar Gmail (${motivo}). Inténtalo de nuevo.`,
      });
    }
    setTimeout(() => setGmailOAuthFeedback(null), 6000);

    params.delete("gmail_oauth");
    params.delete("motivo");
    const nuevaQuery = params.toString();
    window.history.replaceState(
      {},
      "",
      window.location.pathname + (nuevaQuery ? `?${nuevaQuery}` : ""),
    );
  }, []);

  const handleConnectGmailOAuth = async () => {
    setGmailOAuthConnecting(true);
    setGmailOAuthFeedback(null);
    try {
      const { url } = await api.getGmailOAuthAuthorizeUrl();
      window.location.href = url;
    } catch (err: any) {
      console.error("Error iniciando la conexión de Gmail OAuth:", err);
      setGmailOAuthFeedback({
        type: "error",
        message: err?.message || "No se pudo iniciar la conexión con Google.",
      });
      setGmailOAuthConnecting(false);
    }
  };

  const handleDisconnectGmailOAuth = async () => {
    setGmailOAuthDisconnecting(true);
    setGmailOAuthFeedback(null);
    try {
      await api.disconnectGmailOAuth();
      setGmailOAuthStatus({ connected: false });
      setGmailOAuthFeedback({
        type: "success",
        message: "Gmail desconectado.",
      });
      setTimeout(() => setGmailOAuthFeedback(null), 4000);
    } catch (err: any) {
      console.error("Error desconectando Gmail OAuth:", err);
      setGmailOAuthFeedback({
        type: "error",
        message: err?.message || "No se pudo desconectar Gmail.",
      });
    } finally {
      setGmailOAuthDisconnecting(false);
    }
  };

  useEffect(() => {
    if (!bandId) return;
    let isMounted = true;
    const fetchStatus = async () => {
      setLoading(true);
      setFeedback(null);
      try {
        const data: BandEmailAccountStatus =
          await api.getBandEmailAccount(bandId);
        if (isMounted) {
          setStatus(data || { connected: false });
          setEditing(!data?.connected);
        }
      } catch (err) {
        console.error("Error cargando la cuenta de email de la banda:", err);
        if (isMounted) {
          setStatus({ connected: false });
          setEditing(true);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchStatus();
    return () => {
      isMounted = false;
    };
  }, [bandId]);

  // Al elegir Gmail/Outlook se autorrellenan host/puerto y se ocultan los campos manuales;
  //'other' los deja vacíos para que la banda los introduzca a mano.
  const handleProviderChange = (next: Provider) => {
    setProvider(next);
    if (next !== "other") {
      const preset = PROVIDER_PRESETS[next];
      setSmtpHost(preset.smtp_host);
      setSmtpPort(preset.smtp_port);
      setSmtpSecure(preset.smtp_secure);
      setImapHost(preset.imap_host);
      setImapPort(preset.imap_port);
    } else {
      setSmtpHost("");
      setImapHost("");
    }
  };

  const handleSave = async () => {
    if (!email || !appPassword || !smtpHost || !imapHost) {
      setFeedback({
        type: "error",
        message:
          "Rellena email, contraseña de aplicación y los datos de servidor antes de guardar.",
      });
      return;
    }
    if (!bandId) {
      setFeedback({
        type: "error",
        message:
          "No hay ninguna banda activa para conectar esta cuenta de email.",
      });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const saved = await api.saveBandEmailAccount({
        band_id: bandId,
        provider,
        email,
        app_password: appPassword,
        smtp_host: smtpHost,
        smtp_port: Number(smtpPort),
        smtp_secure: smtpSecure,
        imap_host: imapHost,
        imap_port: Number(imapPort),
      });
      setStatus({ connected: true, ...(saved?.data || {}) });
      setAppPassword("");
      setEditing(false);
      setFeedback({
        type: "success",
        message:
          "¡Cuenta de email conectada! El Agente Enviador ya puede usarla para enviar y leer correo real.",
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      console.error("Error guardando la cuenta de email:", err);
      setFeedback({
        type: "error",
        message:
          err?.message || "Ocurrió un error al guardar la cuenta de email.",
      });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = `w-full p-2.5 rounded-[var(--r-m)] text-xs font-sans transition-ui outline-none bg-[var(--surface)] text-[var(--ink-2)]`;
  const labelClass =
    "text-xs font-sans font-semibold text-[var(--ink-2)] flex items-center gap-2";

  if (loading) {
    return (
      <div
        className={`p-6 rounded-[var(--r-l)] flex items-center justify-center gap-3 ${"bg-[var(--surface)]"}`}
      >
        <Loader2 className="w-5 h-5 animate-spin text-[var(--ink-2)]" />
        <span className="text-xs font-sans text-[var(--ink-2)]">
          Comprobando cuenta de email conectada...
        </span>
      </div>
    );
  }

  return (
    <div
      className={`space-y-5 p-5 sm:p-6 rounded-[var(--r-l)] transition-ui ${"bg-[var(--surface)]"}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 ">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-[var(--r-m)] bg-[var(--acc)]/10 text-[var(--ink-2)]">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight">
              Cuenta de Email (Agente Enviador / Lector)
            </h3>
            <p className="text-xs font-sans text-[var(--ink-2)]">
              Gmail, Outlook o cualquier proveedor con SMTP/IMAP - siempre tu
              propia cuenta, nunca compartida entre bandas.
            </p>
          </div>
        </div>

        {status.connected && !editing && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto px-2.5 py-1 rounded-[var(--r-pill)] bg-[var(--ok)]/10 text-[var(--ok)] text-xs font-sans">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Conectado</span>
          </div>
        )}
      </div>

      {/* Conectar Gmail por OAuth: recomendado, sin contraseña de aplicación ni popup - único
 camino sin contraseña que funciona también desde el Agente Enviador programado, que
 corre en el servidor sin banda con sesión abierta (ver server/routes/gmailOAuth.ts).
 Solo para Gmail; Outlook y otros proveedores siguen usando el formulario SMTP/IMAP de
 abajo. */}
      <div
        className={`p-4 rounded-[var(--r-m)] space-y-3 ${"bg-[var(--acc)]/5"}`}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--ink-2)] shrink-0" />
          <h4 className="text-sm font-bold">
            Gmail sin contraseña (recomendado)
          </h4>
        </div>
        <p className="text-xs font-sans text-[var(--ink-2)]">
          Conecta tu cuenta de Gmail con un solo clic - sin generar ninguna
          contraseña de aplicación. Funciona tanto al aprobar un lead a mano
          como en el Agente Enviador programado.
        </p>

        {gmailOAuthLoading ? (
          <div className="flex items-center gap-2 text-xs font-sans text-[var(--ink-2)]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Comprobando conexión de Gmail...</span>
          </div>
        ) : gmailOAuthStatus.connected ? (
          <div
            className={`p-3 rounded-[var(--r-s)] text-xs flex items-center justify-between gap-3 ${"bg-[var(--ok)]/10 text-[var(--ink)]"}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--ok)]" />
              <span className="truncate">
                Conectado como <strong>{gmailOAuthStatus.gmail_email}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleDisconnectGmailOAuth}
              disabled={gmailOAuthDisconnecting}
              className="shrink-0 px-3 py-1.5 rounded-[var(--r-pill)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] text-xs font-sans font-bold transition-ui cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {gmailOAuthDisconnecting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Unlink className="w-3 h-3" />
              )}
              Desconectar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleConnectGmailOAuth}
            disabled={gmailOAuthConnecting}
            className="w-full sm:w-auto px-4 py-2.5 rounded-[var(--r-m)] bg-[var(--acc)] hover:bg-[var(--tentative)] text-[var(--on-acc)] font-bold text-xs font-sans transition-ui active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {gmailOAuthConnecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            <span>
              {gmailOAuthConnecting
                ? "Redirigiendo a Google..."
                : "Conectar con Google"}
            </span>
          </button>
        )}

        {gmailOAuthFeedback && (
          <div
            className={`p-2.5 rounded-[var(--r-s)] text-xs flex items-center gap-2 animate-fadeIn ${
              gmailOAuthFeedback.type === "success"
                ? "bg-[var(--ok)]/10 text-[var(--ink-2)]"
                : "bg-[var(--alert)]/10 text-[var(--ink-2)]"
            }`}
          >
            {gmailOAuthFeedback.type === "success" ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[var(--ok)]" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[var(--alert)]" />
            )}
            <span>{gmailOAuthFeedback.message}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs font-sans text-[var(--ink-2)]">
        <div className="h-px flex-1 bg-[var(--surface)]/80" />
        <span>o conecta por SMTP/IMAP (Outlook u otro proveedor)</span>
        <div className="h-px flex-1 bg-[var(--surface)]/80" />
      </div>

      {status.connected && !editing ? (
        <div className="space-y-3">
          <div
            className={`p-4 rounded-[var(--r-m)] text-xs flex items-center justify-between gap-3 ${"bg-[var(--ok)]/10 text-[var(--ink)]"}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--ok)]" />
              <span className="truncate">
                <strong>{status.email}</strong> (
                {PROVIDER_PRESETS[status.provider as "gmail" | "outlook"]
                  ?.label || "Otro proveedor"}
                )
              </span>
            </div>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="shrink-0 px-3 py-1.5 rounded-[var(--r-pill)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] text-xs font-sans font-bold transition-ui cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" />
              Cambiar cuenta
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className={labelClass}>
              <span>Proveedor</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["gmail", "outlook", "other"] as Provider[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleProviderChange(p)}
                  className={`p-2.5 rounded-[var(--r-pill)] text-xs font-sans font-bold transition-ui cursor-pointer ${
                    provider === p
                      ? "bg-[var(--acc)]/20 text-[var(--tentative)]/40"
                      : "bg-[var(--bg)] text-[var(--ink-2)] hover:bg-[var(--sunken)]"
                  }`}
                >
                  {p === "gmail"
                    ? "Gmail"
                    : p === "outlook"
                      ? "Outlook"
                      : "Otro (manual)"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={labelClass}>
                <Mail className="w-4 h-4 text-[var(--ink-2)]" />
                <span>Email de la banda</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="booking@tubanda.com"
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>
                <KeyRound className="w-4 h-4 text-[var(--ink-2)]" />
                <span>Contraseña de aplicación</span>
              </label>
              <input
                type="password"
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                placeholder="•••• •••• •••• ••••"
                autoComplete="new-password"
                className={inputClass}
              />
            </div>
          </div>

          <div
            className={`p-3 rounded-[var(--r-m)] text-xs flex items-start gap-2 ${"bg-[var(--tentative)]/5 text-[var(--tentative)]"}`}
          >
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--ink-2)]" />
            <span>
              No es la contraseña normal de la cuenta: es una contraseña de
              aplicación de un solo uso que genera el propio proveedor (requiere
              verificación en dos pasos activada).{" "}
              {provider !== "other" && (
                <a
                  href={PROVIDER_PRESETS[provider].helpUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline text-[var(--ink-2)] hover:text-[var(--ink-2)]"
                >
                  Cómo generarla en {PROVIDER_PRESETS[provider].label}
                </a>
              )}
            </span>
          </div>

          {provider === "other" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 ">
              <div className="space-y-2">
                <label className={labelClass}>
                  <span>Servidor SMTP (envío)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp.tudominio.com"
                    className={`${inputClass} flex-1`}
                  />
                  <input
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(Number(e.target.value))}
                    placeholder="465"
                    className={`${inputClass} w-20`}
                  />
                </div>
                <label className="flex items-center gap-1.5 text-xs font-sans text-[var(--ink-2)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smtpSecure}
                    onChange={(e) => setSmtpSecure(e.target.checked)}
                  />
                  Conexión SSL/TLS directa (desmarcar si tu proveedor usa
                  STARTTLS)
                </label>
              </div>
              <div className="space-y-2">
                <label className={labelClass}>
                  <span>Servidor IMAP (lectura)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imapHost}
                    onChange={(e) => setImapHost(e.target.value)}
                    placeholder="imap.tudominio.com"
                    className={`${inputClass} flex-1`}
                  />
                  <input
                    type="number"
                    value={imapPort}
                    onChange={(e) => setImapPort(Number(e.target.value))}
                    placeholder="993"
                    className={`${inputClass} w-20`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {feedback && (
        <div
          className={`p-3 rounded-[var(--r-m)] text-xs flex items-center gap-2 animate-fadeIn ${
            feedback.type === "success"
              ? "bg-[var(--ok)]/10 text-[var(--ink-2)]"
              : "bg-[var(--alert)]/10 text-[var(--ink-2)]"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--ok)]" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-[var(--alert)]" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {editing && (
        <div className="pt-1 flex justify-end gap-2">
          {status.connected && (
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setFeedback(null);
              }}
              className="px-4 py-2.5 rounded-[var(--r-pill)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] font-bold text-xs font-sans transition-ui cursor-pointer"
            >
              Cancelar
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 rounded-[var(--r-m)] bg-[var(--acc)] hover:bg-[var(--tentative)] text-[var(--on-acc)] font-bold text-xs font-sans transition-ui active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Conectando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Cuenta de Email</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
