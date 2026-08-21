import React, { useState, useEffect } from 'react';
import { Mail, Save, Loader2, CheckCircle2, AlertCircle, Info, KeyRound, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { BandEmailAccountStatus } from '../types';

interface EmailAccountConfigProps {
  bandId: string;
  isStitchLight?: boolean;
}

type Provider = 'gmail' | 'outlook' | 'other';

// Host/puerto conocidos por proveedor - la banda no tiene que buscarlos. 'other' se rellena
// a mano (dominio propio / cualquier hosting de correo).
const PROVIDER_PRESETS: Record<Exclude<Provider, 'other'>, { smtp_host: string; smtp_port: number; smtp_secure: boolean; imap_host: string; imap_port: number; label: string; helpUrl: string }> = {
  gmail: {
    smtp_host: 'smtp.gmail.com', smtp_port: 465, smtp_secure: true,
    imap_host: 'imap.gmail.com', imap_port: 993,
    label: 'Gmail',
    helpUrl: 'https://support.google.com/accounts/answer/185833'
  },
  outlook: {
    smtp_host: 'smtp.office365.com', smtp_port: 587, smtp_secure: false,
    imap_host: 'outlook.office365.com', imap_port: 993,
    label: 'Outlook / Microsoft 365',
    helpUrl: 'https://support.microsoft.com/es-es/account-billing/usar-contrase%C3%B1as-de-aplicaci%C3%B3n-en-cuentas-de-microsoft-como-la-autenticaci%C3%B3n-en-dos-pasos-e5e4e6f9-2c4a-4a5b-9a3f-0d2b2a0c8b6a'
  }
};

export const EmailAccountConfig: React.FC<EmailAccountConfigProps> = ({ bandId, isStitchLight = false }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [status, setStatus] = useState<BandEmailAccountStatus>({ connected: false });
  const [editing, setEditing] = useState<boolean>(false);

  const [provider, setProvider] = useState<Provider>('gmail');
  const [email, setEmail] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState<number>(465);
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [imapHost, setImapHost] = useState('');
  const [imapPort, setImapPort] = useState<number>(993);

  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      setLoading(true);
      setFeedback(null);
      try {
        const data: BandEmailAccountStatus = await api.getBandEmailAccount(bandId || 'bakandeya');
        if (isMounted) {
          setStatus(data || { connected: false });
          setEditing(!data?.connected);
        }
      } catch (err) {
        console.error('Error cargando la cuenta de email de la banda:', err);
        if (isMounted) {
          setStatus({ connected: false });
          setEditing(true);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchStatus();
    return () => { isMounted = false; };
  }, [bandId]);

  // Al elegir Gmail/Outlook se autorrellenan host/puerto y se ocultan los campos manuales;
  // 'other' los deja vacíos para que la banda los introduzca a mano.
  const handleProviderChange = (next: Provider) => {
    setProvider(next);
    if (next !== 'other') {
      const preset = PROVIDER_PRESETS[next];
      setSmtpHost(preset.smtp_host);
      setSmtpPort(preset.smtp_port);
      setSmtpSecure(preset.smtp_secure);
      setImapHost(preset.imap_host);
      setImapPort(preset.imap_port);
    } else {
      setSmtpHost('');
      setImapHost('');
    }
  };

  const handleSave = async () => {
    if (!email || !appPassword || !smtpHost || !imapHost) {
      setFeedback({ type: 'error', message: 'Rellena email, contraseña de aplicación y los datos de servidor antes de guardar.' });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const saved = await api.saveBandEmailAccount({
        band_id: bandId || 'bakandeya',
        provider,
        email,
        app_password: appPassword,
        smtp_host: smtpHost,
        smtp_port: Number(smtpPort),
        smtp_secure: smtpSecure,
        imap_host: imapHost,
        imap_port: Number(imapPort)
      });
      setStatus({ connected: true, ...(saved?.data || {}) });
      setAppPassword('');
      setEditing(false);
      setFeedback({ type: 'success', message: '¡Cuenta de email conectada! El Agente Enviador ya puede usarla para enviar y leer correo real.' });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      console.error('Error guardando la cuenta de email:', err);
      setFeedback({ type: 'error', message: err?.message || 'Ocurrió un error al guardar la cuenta de email.' });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = `w-full p-2.5 rounded-xl text-xs font-mono transition-all outline-none ${
    isStitchLight
      ? 'bg-slate-50 border border-slate-300 text-slate-800 focus:border-indigo-500'
      : 'bg-neutral-950 border border-neutral-800 text-neutral-200 focus:border-sky-500/60'
  }`;
  const labelClass = 'text-xs font-mono font-semibold text-neutral-300 flex items-center gap-2';

  if (loading) {
    return (
      <div className={`p-6 rounded-2xl flex items-center justify-center gap-3 ${
        isStitchLight ? 'bg-slate-50 border border-slate-200' : 'bg-neutral-900/60 border border-neutral-800'
      }`}>
        <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
        <span className="text-xs font-mono text-neutral-400">Comprobando cuenta de email conectada...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-5 p-5 sm:p-6 rounded-2xl border transition-all ${
      isStitchLight
        ? 'bg-white border-slate-200 shadow-sm'
        : 'bg-neutral-900/70 border-neutral-800 text-white'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800/60">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight">Cuenta de Email (Agente Enviador / Lector)</h3>
            <p className="text-xs font-mono text-neutral-400">
              Gmail, Outlook o cualquier proveedor con SMTP/IMAP - siempre tu propia cuenta, nunca compartida entre bandas.
            </p>
          </div>
        </div>

        {status.connected && !editing && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Conectado</span>
          </div>
        )}
      </div>

      {status.connected && !editing ? (
        <div className="space-y-3">
          <div className={`p-4 rounded-xl text-xs flex items-center justify-between gap-3 border ${
            isStitchLight ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="truncate">
                <strong>{status.email}</strong> ({PROVIDER_PRESETS[status.provider as 'gmail' | 'outlook']?.label || 'Otro proveedor'})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5"
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
              {(['gmail', 'outlook', 'other'] as Provider[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleProviderChange(p)}
                  className={`p-2.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                    provider === p
                      ? 'bg-sky-500/20 border-sky-400/80 text-sky-200 shadow-sm shadow-sky-900/30'
                      : isStitchLight
                      ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      : 'bg-neutral-950/80 border-neutral-800/80 text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
                  }`}
                >
                  {p === 'gmail' ? 'Gmail' : p === 'outlook' ? 'Outlook' : 'Otro (manual)'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={labelClass}>
                <Mail className="w-4 h-4 text-sky-400" />
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
                <KeyRound className="w-4 h-4 text-sky-400" />
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

          <div className={`p-3 rounded-xl text-[11px] flex items-start gap-2 border ${
            isStitchLight ? 'bg-indigo-50/80 border-indigo-100 text-indigo-950' : 'bg-neutral-950 border-neutral-800 text-neutral-400'
          }`}>
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-sky-400" />
            <span>
              No es la contraseña normal de la cuenta: es una contraseña de aplicación de un solo uso que genera el propio
              proveedor (requiere verificación en dos pasos activada). {provider !== 'other' && (
                <a href={PROVIDER_PRESETS[provider].helpUrl} target="_blank" rel="noreferrer" className="underline text-sky-400 hover:text-sky-300">
                  Cómo generarla en {PROVIDER_PRESETS[provider].label}
                </a>
              )}
            </span>
          </div>

          {provider === 'other' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-800/60">
              <div className="space-y-2">
                <label className={labelClass}><span>Servidor SMTP (envío)</span></label>
                <div className="flex gap-2">
                  <input type="text" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.tudominio.com" className={`${inputClass} flex-1`} />
                  <input type="number" value={smtpPort} onChange={(e) => setSmtpPort(Number(e.target.value))} placeholder="465" className={`${inputClass} w-20`} />
                </div>
                <label className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400 cursor-pointer">
                  <input type="checkbox" checked={smtpSecure} onChange={(e) => setSmtpSecure(e.target.checked)} />
                  Conexión SSL/TLS directa (desmarcar si tu proveedor usa STARTTLS)
                </label>
              </div>
              <div className="space-y-2">
                <label className={labelClass}><span>Servidor IMAP (lectura)</span></label>
                <div className="flex gap-2">
                  <input type="text" value={imapHost} onChange={(e) => setImapHost(e.target.value)} placeholder="imap.tudominio.com" className={`${inputClass} flex-1`} />
                  <input type="number" value={imapPort} onChange={(e) => setImapPort(Number(e.target.value))} placeholder="993" className={`${inputClass} w-20`} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {feedback && (
        <div className={`p-3 rounded-xl text-xs flex items-center gap-2 animate-fadeIn ${
          feedback.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {editing && (
        <div className="pt-1 flex justify-end gap-2">
          {status.connected && (
            <button
              type="button"
              onClick={() => { setEditing(false); setFeedback(null); }}
              className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs font-mono transition-all cursor-pointer"
            >
              Cancelar
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-neutral-950 font-bold text-xs font-mono transition-all shadow-lg shadow-sky-500/10 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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
