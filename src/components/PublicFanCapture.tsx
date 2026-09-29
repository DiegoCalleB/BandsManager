import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Heart,
  CheckCircle2,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Mail,
  User,
  MapPin,
  Music,
} from "lucide-react";
import { sanitizeConcertDisplayName } from "../utils/fanUtils";

export const PublicFanCapture: React.FC = () => {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [comoConocio, setComoConocio] = useState("");
  const [conciertoOrigenId, setConciertoOrigenId] = useState("");
  const [conciertoOrigenNombre, setConciertoOrigenNombre] = useState("");
  const [consentimientoRGPD, setConsentimientoRGPD] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [incentivoData, setIncentivoData] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [bandInfo, setBandInfo] = useState<{ name: string; logoUrl: string }>({
    name: "",
    logoUrl: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cId = params.get("concertId") || params.get("cId") || "";
    const cName = params.get("concertName") || params.get("cName") || "";
    const bandId = params.get("band_id") || params.get("band") || "";

    if (cId) setConciertoOrigenId(cId);
    if (cName) {
      const sanitizedName = sanitizeConcertDisplayName(cName);
      setConciertoOrigenNombre(sanitizedName);
      setComoConocio(`Concierto: ${sanitizedName}`);
    } else {
      setComoConocio("En directo / Concierto");
    }

    fetch(
      `/api/public/epk${bandId ? `?band_id=${encodeURIComponent(bandId)}` : ""}`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (data?.bandName) {
          const isBkn =
            (data.bandId || "").includes("bakandeya") ||
            data.bandName.toLowerCase().includes("bakandeya");
          setBandInfo({
            name: data.bandName,
            logoUrl:
              data.epkConfig?.logoUrl || (isBkn ? "/logo_bakandeya.jpg" : ""),
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!nombre.trim() || !email.trim()) {
      setErrorMsg("Por favor, introduce tu nombre y tu correo electrónico.");
      return;
    }

    if (!consentimientoRGPD) {
      setErrorMsg(
        "Debes aceptar la casilla de consentimiento de privacidad (RGPD) para continuar.",
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/public/fans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          email,
          ciudad,
          comoConocio,
          conciertoOrigenId,
          conciertoOrigenNombre,
          consentimientoRGPD,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setErrorMsg(data.error || "Ocurrió un error al guardar tu registro.");
        return;
      }

      setIncentivoData(data.incentivo);
      setSubmitted(true);
    } catch (err: any) {
      console.error("Error submitting fan form:", err);
      setLoading(false);
      setErrorMsg("No se pudo conectar con el servidor. Inténtalo de nuevo.");
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--ink-2)] flex flex-col items-center justify-center p-4 selection:bg-[var(--acc)] selection:text-[var(--ink)]">
      {/* Background Glow */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[var(--acc)]/10 via-[var(--surface)] to-[var(--surface)] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* LOGO & BRAND HEADER */}
        <div className="text-center space-y-3">
          <div className="inline-block relative">
            {bandInfo.logoUrl ? (
              <img
                src={bandInfo.logoUrl}
                alt={bandInfo.name || "Logo"}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-[var(--r-l)] mx-auto object-cover"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[var(--r-l)] mx-auto bg-[var(--sunken)]  flex items-center justify-center text-[var(--acc)]">
                <Music className="w-10 h-10" />
              </div>
            )}
            <span className="absolute -bottom-2 -right-2 bg-[var(--acc)] text-[var(--ink)] p-1.5 rounded-[var(--r-pill)]">
              <Heart className="w-4 h-4 fill-neutral-950" />
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--ink)]">
            {bandInfo.name
              ? `¡SÚMATE A LA FAMILIA DE ${bandInfo.name.toUpperCase()}!`
              : "¡SÚMATE A NUESTRA COMUNIDAD!"}
          </h1>
          <p className="text-[var(--ink-2)] text-sm max-w-xs mx-auto">
            {conciertoOrigenNombre ? (
              <span>
                Gracias por bailar con nosotros en{" "}
                <strong className="text-[var(--acc)]">
                  {conciertoOrigenNombre}
                </strong>
                . Recibe información directa en tu correo.
              </span>
            ) : (
              <span>
                Recibe información de Bakandeya directamente en tu correo.
              </span>
            )}
          </p>
        </div>

        {!submitted ? (
          /* FORM CARD */
          <form
            onSubmit={handleSubmit}
            className="bg-[var(--surface)]/90 rounded-[var(--r-l)] p-6 space-y-4"
          >
            {errorMsg && (
              <div className="p-3 bg-[var(--alert)]/90 text-[var(--alert)]/40 text-xs rounded-[var(--r-m)] font-medium">
                ⚠️ {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--acc)]/70 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Nombre y Apellidos *
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Laura García"
                className="w-full bg-[var(--sunken)] focus:rounded-[var(--r-m)] px-3.5 py-2.5 text-sm text-[var(--ink)] placeholder-[var(--ink-2)] outline-none transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--acc)]/70 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Correo Electrónico *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tuemail@ejemplo.com"
                className="w-full bg-[var(--sunken)] focus:rounded-[var(--r-m)] px-3.5 py-2.5 text-sm text-[var(--ink)] placeholder-[var(--ink-2)] outline-none transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--ink-2)] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[var(--acc)]" /> Ciudad
                </label>
                <input
                  type="text"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  placeholder="Ej: Madrid"
                  className="w-full bg-[var(--sunken)] focus:rounded-[var(--r-m)] px-3 py-2 text-xs text-[var(--ink)] placeholder-[var(--ink-2)] outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--ink-2)] flex items-center gap-1">
                  <Music className="w-3 h-3 text-[var(--acc)]" /> ¿Origen?
                </label>
                <input
                  type="text"
                  value={comoConocio}
                  onChange={(e) => setComoConocio(e.target.value)}
                  placeholder="Ej: Directo / Instagram"
                  className="w-full bg-[var(--sunken)] focus:rounded-[var(--r-m)] px-3 py-2 text-xs text-[var(--ink)] placeholder-[var(--ink-2)] outline-none transition"
                />
              </div>
            </div>

            {/* MANDATORY GDPR CHECKBOX */}
            <div className="pt-2 ">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[var(--ink-2)] leading-relaxed select-none">
                <input
                  type="checkbox"
                  required
                  checked={consentimientoRGPD}
                  onChange={(e) => setConsentimientoRGPD(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded bg-[var(--sunken)] text-[var(--acc)] focus:ring-[var(--acc)] focus:ring-offset-neutral-900"
                />
                <span>
                  Acepto recibir novedades, lanzamientos y fechas de conciertos
                  de <strong>Bakandeya</strong>.
                  <span className="block text-micro text-[var(--ink-2)] mt-0.5">
                    Responsable: Bakandeya. Puedes darte de baja en cualquier
                    momento con 1 clic.
                  </span>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--ink)] font-extrabold text-sm rounded-[var(--r-m)] transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>UNIRME A BAKANDEYA</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* THANK YOU CARD */
          <div className="bg-[var(--surface)]/90 rounded-[var(--r-l)] p-6 sm:p-8 space-y-6 text-center animate-fade-in">
            <div className="w-16 h-16 bg-[var(--acc)]/20 text-[var(--acc)] rounded-[var(--r-pill)] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-[var(--ink)]">
                ¡MUCHAS GRACIAS, {nombre.split("")[0].toUpperCase()}!
              </h2>
              <p className="text-[var(--ink-2)] text-sm leading-relaxed">
                ¡Ya estás apuntado! Te avisaremos por correo de próximas fechas
                y novedades.
              </p>
            </div>

            <div className="pt-2 text-xs text-[var(--ink-2)] flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--ok)]" /> Tus datos
              están seguros y protegidos.
            </div>
          </div>
        )}

        {/* Banner para músicos y bandas */}
        <div className="pt-2">
          <a
            href="/musicos"
            className="group block p-3.5 rounded-[var(--r-m)] bg-[var(--surface)]/80  transition-ui text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[var(--r-s)] bg-[var(--acc)]/10 flex items-center justify-center text-[var(--acc)] shrink-0">
                <Music className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[var(--ink-2)] group-hover:text-[var(--acc)]/70 transition-colors">
                  ¿Eres músico o tienes una banda?
                </p>
                <p className="text-xs text-[var(--ink-2)]">
                  Consigue una página como esta para tu grupo con BandManager →
                </p>
              </div>
            </div>
          </a>
        </div>

        <footer className="text-center text-xs text-[var(--ink-2)]">
          Bakandeya Official Community • Powered by BandManager
        </footer>
      </div>
    </div>
  );
};

export default PublicFanCapture;
