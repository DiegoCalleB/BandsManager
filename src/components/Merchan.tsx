import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Image as ImageIcon,
  Shirt,
  Tag,
  QrCode,
  Download,
  RefreshCw,
  Wand2,
  Type,
  Upload,
  Trash2,
  Scissors,
  Layers,
  Plus,
  Gift,
  PackageCheck,
  MapPin,
  CheckCircle2,
  X,
  ArrowRight,
  Truck,
  Clock,
  Palette,
  Phone,
  User,
  Building,
} from "lucide-react";
import { ThemeColors, ThemeName } from "../types";
import QRCode from "react-qr-code";
import { resolveAudioUrl, uploadFileToServer } from "../utils/audioStorage";

const ResolvedBgImage: React.FC<{
  url: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}> = ({ url, className, style, onClick }) => {
  const [resolved, setResolved] = useState<string | null>(null);
  useEffect(() => {
    if (url) {
      resolveAudioUrl(url)
        .then((res) => setResolved(res))
        .catch(() => setResolved(null));
    } else {
      setResolved(null);
    }
  }, [url]);

  return (
    <div
      className={className}
      style={{
        ...style,
        backgroundImage: resolved ? `url(${resolved})` : "none",
      }}
      onClick={onClick}
    />
  );
};

const isLightColor = (hex: string) => {
  const hexColor = hex.replace("#", "");
  if (hexColor.length !== 6) return false;
  const r = parseInt(hexColor.substr(0, 2), 16);
  const g = parseInt(hexColor.substr(2, 2), 16);
  const b = parseInt(hexColor.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
};

// Canvas background removal helper (recorte de fondo sin distorsión por capas)
async function processBackgroundRemoval(
  imageUrl: string,
  mode: "white" | "black" | "none",
): Promise<string> {
  if (mode === "none") return imageUrl;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(imageUrl);
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          if (mode === "white" && r > 225 && g > 225 && b > 225) {
            data[i + 3] = 0; // Alpha 0
          } else if (mode === "black" && r < 30 && g < 30 && b < 30) {
            data[i + 3] = 0; // Alpha 0
          }
        }
        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        console.warn("Canvas background processing error:", err);
        resolve(imageUrl);
      }
    };
    img.onerror = () => resolve(imageUrl);
    img.src = imageUrl;
  });
}

const SHIRT_COLORS = [
  { id: "#121111", name: "Negro Noche" },
  { id: "#ffffff", name: "Blanco Puro" },
  { id: "#4b5563", name: "Gris Asfalto" },
  { id: "#7f1d1d", name: "Rojo Vino" },
  { id: "#1e3a8a", name: "Azul Marino" },
  { id: "#14532d", name: "Verde Bosque" },
  { id: "var(--acc)", name: "Ámbar Dorado" },
];

interface MerchanProps {
  colors: ThemeColors;
  currentTheme: ThemeName;
  bandId?: string;
  bandName?: string;
  bandLogoUrl?: string;
}

export default function Merchan({
  colors,
  currentTheme,
  bandId,
  bandName,
  bandLogoUrl,
}: MerchanProps) {
  const isDemo = false;

  // La plantilla de Bakandeya (logo/álbumes/catálogo de temas de demo) solo debe verse en la
  // propia Bakandeya: mismo criterio que RepertorioSetlists.tsx (ver"isBakandeya" ahí) para no
  // filtrar el logo, redes sociales o discografía de la banda de demo al taller de cualquier
  // otra banda.
  const cleanBand = (bandId || "").replace(/^(band|reg)-/, "").toLowerCase();
  const isBakandeya = cleanBand === "bakandeya";
  const displayBandName = bandName || "Tu Banda";
  const bandInitials =
    displayBandName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || "")
      .join("") || "TB";

  const [productType, setProductType] = useState<"camiseta" | "pegatina">(
    "camiseta",
  );
  const [assetType, setAssetType] = useState<"logo" | "portada" | "custom">(
    "logo",
  );
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [removeBgMode, setRemoveBgMode] = useState<"none" | "white" | "black">(
    "white",
  );
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedAlbumIndex, setSelectedAlbumIndex] = useState(0);
  const [qrUrl, setQrUrl] = useState("");
  const [shirtColor, setShirtColor] = useState("var(--ink)");

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDesigns, setGeneratedDesigns] = useState<
    {
      id: string;
      type: string;
      url: string;
      processedUrl?: string;
      bg: string;
      text: string;
      assetType: string;
      shirtColor?: string;
      qrUrl?: string;
      date: string;
    }[]
  >([]);

  const [albums, setAlbums] = useState<{ name: string; url: string }[]>(
    isBakandeya
      ? [
          {
            name: "Bakandeya (2025)",
            url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80",
          },
          {
            name: "EP Cacharros",
            url: "https://images.unsplash.com/photo-1493225457124-a1a2a5f590bc?w=500&q=80",
          },
        ]
      : [],
  );

  // Regalo de bienvenida: Estado de canje de pack de pegatinas
  const [hasGiftPending, setHasGiftPending] = useState(true);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimStep, setClaimStep] = useState<"form" | "success">("form");
  const [selectedGiftDesignId, setSelectedGiftDesignId] =
    useState<string>("default-logo");
  // El formulario de envío del regalo empezaba precargado con el nombre, la dirección real y el
  // teléfono del fundador: cualquier banda que reclamase su pack de pegatinas sin fijarse en el
  // formulario acababa enviando el regalo a su casa en vez de a la suya propia.
  const [shippingForm, setShippingForm] = useState({
    nombre: "",
    direccion: "",
    cp: "",
    ciudad: "",
    telefono: "",
    notas: "",
  });

  useEffect(() => {
    try {
      const key = `band_songs_${cleanBand || "default"}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const songs = JSON.parse(saved);
        const albumsMap = new Map<string, string>();
        songs.forEach((s: any) => {
          if (s.albumDisco && s.portadaUrl && s.portadaUrl !== "") {
            if (!albumsMap.has(s.albumDisco)) {
              albumsMap.set(s.albumDisco, s.portadaUrl);
            }
          }
        });

        if (albumsMap.size > 0) {
          const loadedAlbums = Array.from(albumsMap.entries()).map(
            ([name, url]) => ({ name, url }),
          );
          setAlbums(loadedAlbums);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [cleanBand, isBakandeya]);

  // Galería de diseños generados, cacheada por banda (misma convención que el resto del módulo
  // de repertorio: ver `band_songs_${cleanBand}` arriba) para que una banda nunca vea los diseños
  // de merchandising de otra.
  useEffect(() => {
    try {
      const key = `merchan_designs_${cleanBand || "default"}`;
      const saved = localStorage.getItem(key);
      setGeneratedDesigns(saved ? JSON.parse(saved) : []);
    } catch {
      setGeneratedDesigns([]);
    }
  }, [cleanBand]);

  useEffect(() => {
    const key = `merchan_designs_${cleanBand || "default"}`;
    localStorage.setItem(key, JSON.stringify(generatedDesigns));
  }, [generatedDesigns, cleanBand]);

  const handleDelete = (id: string) => {
    setGeneratedDesigns((prev) => prev.filter((d) => d.id !== id));
  };

  const handleClearAll = () => {
    if (
      window.confirm(
        "¿Seguro que deseas vaciar la galería de diseños de merchandising?",
      )
    ) {
      setGeneratedDesigns([]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const serverUrl = await uploadFileToServer(file);
      setCustomImageUrl(serverUrl);
      setAssetType("custom");
    } catch (err) {
      console.error("Error al subir imagen:", err);
      // Fallback to local FileReader
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setCustomImageUrl(ev.target.result as string);
          setAssetType("custom");
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);

    let rawGraphicUrl = bandLogoUrl || "";
    if (assetType === "portada" && albums[selectedAlbumIndex]) {
      rawGraphicUrl = albums[selectedAlbumIndex].url;
    } else if (assetType === "custom" && customImageUrl) {
      rawGraphicUrl = customImageUrl;
    }

    // Process layer transparency on canvas before composition
    const processedUrl = await processBackgroundRemoval(
      rawGraphicUrl,
      removeBgMode,
    );

    setTimeout(() => {
      const newDesign = {
        id: Date.now().toString(),
        type: productType,
        url: rawGraphicUrl,
        processedUrl: processedUrl,
        bg: "bg-[var(--surface)]",
        text: "Generado con Capas Canvas",
        assetType,
        shirtColor: productType === "camiseta" ? shirtColor : undefined,
        qrUrl: productType === "pegatina" ? qrUrl : undefined,
        date: new Date().toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
        }),
      };
      setGeneratedDesigns([newDesign, ...generatedDesigns]);
      setIsGenerating(false);
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className={`text-2xl sm:text-3xl font-black font-display flex items-center gap-3 ${"text-[var(--ink)]"}`}
          >
            <Sparkles className={`w-8 h-8 ${"text-[var(--acc)]"}`} />
            Taller de Merchandising IA
          </h1>
          <p
            className={`text-xs sm:text-sm font-sans max-w-2xl leading-relaxed ${"text-[var(--ink-2)]"}`}
          >
            Diseña camisetas y pegatinas oficiales con recorte de fondo
            automático por capas Canvas (sin distorsión de la prenda), subida de
            imágenes propias e integración de QR.
          </p>
        </div>
        {generatedDesigns.length > 0 && (
          <button
            onClick={handleClearAll}
            className="self-start sm:self-center px-3 py-1.5 rounded-[var(--r-m)] text-[var(--alert)] hover:bg-[var(--alert)]/10 text-xs font-sans font-bold flex items-center gap-2 transition"
          >
            <Trash2 className="w-3.5 h-3.5" /> Vaciar Galería (
            {generatedDesigns.length})
          </button>
        )}
      </header>

      {/* 🎁 Banner de Regalo Pendiente de Canjear */}
      {hasGiftPending && (
        <div className="p-4 sm:p-5 rounded-[var(--r-l)] bg-[var(--acc)]/20   flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-[var(--r-l)] bg-[var(--acc)]/60 text-[var(--on-acc)] flex items-center justify-center shrink-0">
              <Gift className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-sans font-black px-2 py-0.5 rounded bg-[var(--acc)]/60 text-[var(--on-acc)]">
                  Regalo de Bienvenida · Plan De Gira
                </span>
                <span className="text-[10px] font-sans text-[var(--acc)]/70 font-bold">
                  500 uds Vinilo Mate
                </span>
              </div>
              <p className="text-sm font-bold text-[var(--ink)] mt-1">
                Tienes 500 pegatinas gratis esperando. Diseña las tuyas y
                pídelas.
              </p>
              <p className="text-xs text-[var(--ink-2)] mt-0.5">
                Impresión en vinilo de alta resistencia y envío gratuito a tu
                local o domicilio.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                setClaimStep("form");
                setShowClaimModal(true);
              }}
              className="w-full md:w-auto px-5 py-2.5 rounded-[var(--r-m)] bg-[var(--acc)]  hover:bg-[var(--acc)] text-[var(--ink)] text-xs font-black font-sans transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <PackageCheck className="w-4 h-4" />
              <span>Canjear Pegatinas Gratis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Panel de Control */}
        <div
          className={`lg:col-span-4 p-5 rounded-[var(--r-l)] space-y-6 h-fit ${"bg-[var(--surface)]"}`}
        >
          <div className="space-y-3">
            <label
              className={`block text-[10px] font-sans font-bold ${"text-[var(--ink-2)]"}`}
            >
              1. Tipo de Producto
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setProductType("camiseta")}
                className={`py-3 px-4 rounded-[var(--r-m)] font-sans text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all ${
                  productType === "camiseta"
                    ? "bg-[var(--acc)] text-[var(--ink)]/10"
                    : "bg-[var(--bg)] text-[var(--ink-2)] hover:bg-[var(--sunken)]"
                }`}
              >
                <Shirt className="w-6 h-6" />
                Camiseta
              </button>
              <button
                onClick={() => setProductType("pegatina")}
                className={`py-3 px-4 rounded-[var(--r-m)] font-sans text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all ${
                  productType === "pegatina"
                    ? "bg-[var(--acc)] text-[var(--ink)]/10"
                    : "bg-[var(--bg)] text-[var(--ink-2)] hover:bg-[var(--sunken)]"
                }`}
              >
                <Tag className="w-6 h-6" />
                Pegatina / Sticker
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label
              className={`block text-[10px] font-sans font-bold ${"text-[var(--ink-2)]"}`}
            >
              2. Origen del Arte Gráfico
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setAssetType("logo")}
                className={`py-2 px-2 rounded-[var(--r-s)] font-sans text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                  assetType === "logo"
                    ? "bg-[var(--acc)]/15 text-[var(--acc)]/30"
                    : "bg-[var(--bg)] text-[var(--ink-2)] hover:bg-[var(--sunken)]"
                }`}
              >
                <Type className="w-4 h-4" />
                Logo Oficial
              </button>
              <button
                onClick={() => setAssetType("portada")}
                className={`py-2 px-2 rounded-[var(--r-s)] font-sans text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                  assetType === "portada"
                    ? "bg-[var(--acc)]/15 text-[var(--acc)]/30"
                    : "bg-[var(--bg)] text-[var(--ink-2)] hover:bg-[var(--sunken)]"
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                Álbum
              </button>
              <button
                onClick={() => {
                  setAssetType("custom");
                  if (!customImageUrl) fileInputRef.current?.click();
                }}
                className={`py-2 px-2 rounded-[var(--r-s)] font-sans text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                  assetType === "custom"
                    ? "bg-[var(--acc)]/15 text-[var(--acc)]/30"
                    : "bg-[var(--bg)] text-[var(--ink-2)] hover:bg-[var(--sunken)]"
                }`}
              >
                <Upload className="w-4 h-4" />
                Propia
              </button>
            </div>

            {/* Hidden File Input for Custom Image */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Custom Upload Preview / Selector */}
          {assetType === "custom" && (
            <div
              className={`p-4 rounded-[var(--r-m)] space-y-3 ${"bg-[var(--sunken)]"}`}
            >
              <div className="flex items-center justify-between">
                <label
                  className={`text-[10px] font-sans font-bold ${"text-[var(--ink-2)]"}`}
                >
                  Imagen Personalizada Subida
                </label>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="text-xs font-sans font-bold text-[var(--acc)] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />{" "}
                  {customImageUrl ? "Cambiar" : "Subir"}
                </button>
              </div>

              {customImageUrl ? (
                <div
                  className="relative w-full h-28 rounded-[var(--r-s)] overflow-hidden bg-center bg-contain bg-no-repeat bg-[var(--surface)]"
                  style={{ backgroundImage: `url(${customImageUrl})` }}
                />
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full h-24 rounded-[var(--r-s)] hover:flex flex-col items-center justify-center gap-2 text-[var(--ink-2)] hover:text-[var(--acc)] transition"
                >
                  {isUploading ? (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6" />
                      <span className="text-xs font-sans">
                        Seleccionar archivo de tu dispositivo
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {assetType === "portada" && (
            <div
              className={`p-4 rounded-[var(--r-m)] ${"bg-[var(--sunken)]"}`}
            >
              <label
                className={`block text-[10px] font-sans font-bold mb-2 ${"text-[var(--ink-2)]"}`}
              >
                Selecciona Álbum / EP
              </label>
              <div className="flex overflow-x-auto shrink-0 gap-3 pb-2 snap-x">
                {albums.map((album, idx) => (
                  <ResolvedBgImage
                    key={idx}
                    onClick={() => setSelectedAlbumIndex(idx)}
                    className={`shrink-0 w-20 h-20 rounded-[var(--r-s)] bg-cover bg-center transition-all snap-start cursor-pointer ${
                      selectedAlbumIndex === idx
                        ? "ring-2 ring-[var(--acc)]"
                        : "opacity-50 hover:opacity-100"
                    }`}
                    url={album.url}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Opción de recorte de fondo / rembg */}
          <div
            className={`p-4 rounded-[var(--r-m)] space-y-2 ${"bg-[var(--tentative)]/20"}`}
          >
            <label
              className={`block text-[10px] font-sans font-bold flex items-center gap-1.5 ${"text-[var(--tentative)]"}`}
            >
              <Scissors className="w-3.5 h-3.5 text-[var(--acc)]" /> Recorte de
              Fondo (Canvas Layering)
            </label>
            <p className="text-[10px] font-sans text-[var(--ink-2)]">
              Aplica el arte directamente en capas sobre la tela sin redibujar
              la prenda.
            </p>
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {[
                { id: "white", label: "Eliminar Blanco" },
                { id: "black", label: "Eliminar Negro" },
                { id: "none", label: "Mantener Fondo" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setRemoveBgMode(m.id as any)}
                  className={`py-1.5 px-1 rounded text-[10px] font-sans font-bold transition ${
                    removeBgMode === m.id
                      ? "bg-[var(--acc)] text-[var(--ink)]"
                      : "bg-[var(--surface)]/60 text-[var(--ink-2)] hover:bg-[var(--surface)]"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {productType === "camiseta" && (
            <div className="space-y-3">
              <label
                className={`font-sans text-[10px] font-bold ${"text-[var(--ink-2)]"}`}
              >
                3. Color de la Prenda
              </label>
              <div className="flex flex-wrap gap-2">
                {SHIRT_COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setShirtColor(c.id)}
                    className={`w-8 h-8 rounded-[var(--r-pill)] transition-transform hover:scale-110 ${shirtColor === c.id ? "ring-2 ring-[var(--acc)] scale-110" : ""}`}
                    style={{ backgroundColor: c.id }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          )}

          {productType === "pegatina" && (
            <div
              className={`p-4 rounded-[var(--r-m)] space-y-3 ${"bg-[var(--tentative)]/10"}`}
            >
              <label
                className={`block text-[10px] font-sans font-bold flex items-center gap-1.5 ${"text-[var(--tentative)]"}`}
              >
                <QrCode className="w-3.5 h-3.5" /> Link de redirección del QR
              </label>
              <input
                type="url"
                value={qrUrl}
                onChange={(e) => setQrUrl(e.target.value)}
                placeholder="https://instagram.com/tu_banda"
                className="w-full rounded-[var(--r-s)] px-3 py-2 text-xs font-sans focus:outline-none bg-[var(--sunken)] text-[var(--ink-2)]"
              />
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`w-full py-4 rounded-[var(--r-m)] font-sans text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              isGenerating
                ? "opacity-70 cursor-not-allowed"
                : "hover:scale-[1.01]"
            } ${"bg-[var(--acc)]  text-[var(--ink)]/10"}`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Procesando Capas Canvas...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Generar Diseño Mockup
              </>
            )}
          </button>
        </div>

        {/* Zona de Vista Previa y Galería */}
        <div
          className={`lg:col-span-8 p-6 rounded-[var(--r-l)] space-y-6 min-h-[500px] flex flex-col ${"bg-[var(--surface)]"}`}
        >
          <div className="flex items-center justify-between">
            <h2
              className={`font-sans text-xs font-bold flex items-center gap-2 ${"text-[var(--ink-2)]"}`}
            >
              <Layers className="w-4 h-4 text-[var(--acc)]" /> Galería de
              Diseños Producidos ({generatedDesigns.length})
            </h2>
          </div>

          <div className="flex-1">
            {generatedDesigns.length === 0 && !isGenerating ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-center p-10">
                <div
                  className={`w-20 h-20 rounded-[var(--r-pill)] flex items-center justify-center ${"bg-[var(--bg)] text-[var(--ink-2)]"}`}
                >
                  <ImageIcon className="w-8 h-8" />
                </div>
                <div>
                  <p
                    className={`font-display text-lg font-bold mb-1 ${"text-[var(--ink-2)]"}`}
                  >
                    El taller está listo
                  </p>
                  <p
                    className={`font-sans text-xs max-w-sm ${"text-[var(--ink-2)]"}`}
                  >
                    Configura las opciones, sube tu imagen o selecciona un logo
                    y pulsa"Generar Diseño Mockup" para previsualizar los
                    resultados.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {generatedDesigns.map((design) => {
                  const displayGraphic = design.processedUrl || design.url;
                  return (
                    <div
                      key={design.id}
                      className={`group relative rounded-[var(--r-l)] overflow-hidden aspect-square  transition-all flex flex-col items-center justify-center p-6 ${design.type === "camiseta" ? "bg-[var(--sunken)]" : "bg-[var(--sunken)]"}`}
                    >
                      {design.type === "pegatina" ? (
                        <div className="w-52 h-52 bg-[var(--surface)] flex flex-col relative transform group-hover:scale-105 transition-transform duration-500 rounded-[var(--r-s)] overflow-hidden">
                          {design.assetType === "portada" ||
                          design.assetType === "custom" ? (
                            <ResolvedBgImage
                              className="h-36 w-full bg-cover bg-center"
                              url={displayGraphic}
                            />
                          ) : (
                            <div className="h-36 w-full bg-[var(--bg)] flex items-center justify-center p-2">
                              <div
                                className="w-full h-full bg-contain bg-center bg-no-repeat"
                                style={{
                                  backgroundImage: `url(${displayGraphic})`,
                                  filter: "invert(1)",
                                }}
                              />
                            </div>
                          )}
                          <div className="h-16 w-full bg-[var(--sunken)] flex items-center justify-between px-3">
                            <div className="font-sans text-[10px] text-[var(--ink)] font-black leading-tight">
                              {displayBandName.toUpperCase()}
                              <br />
                              <span className="text-[var(--accent-alt)]">
                                SCAN QR
                              </span>
                            </div>
                            <div className="relative w-12 h-12 flex items-center justify-center">
                              <QRCode
                                value={design.qrUrl || qrUrl}
                                size={44}
                                level="H"
                              />
                              {bandLogoUrl && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="w-3.5 h-3.5 bg-[var(--surface)] rounded-[var(--r-s)] flex items-center justify-center overflow-hidden p-0.5">
                                    <img
                                      src={bandLogoUrl}
                                      alt="Logo"
                                      className="w-full h-full object-cover rounded-[var(--r-s)]"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full relative flex flex-col items-center justify-center z-10 pt-2">
                          <div className="relative w-44 h-56 transform group-hover:scale-105 transition-transform duration-500">
                            {/* Left Sleeve */}
                            <div
                              className="absolute top-1 -left-6 w-12 h-14 rounded-[var(--r-m)] rotate-[20deg]"
                              style={{
                                backgroundColor:
                                  design.shirtColor || "var(--ink)",
                                zIndex: 1,
                              }}
                            />
                            {/* Right Sleeve */}
                            <div
                              className="absolute top-1 -right-6 w-12 h-14 rounded-[var(--r-m)] -rotate-[20deg]"
                              style={{
                                backgroundColor:
                                  design.shirtColor || "var(--ink)",
                                zIndex: 1,
                              }}
                            />

                            {/* Main Body */}
                            <div
                              className="absolute inset-0 rounded-[var(--r-l)] flex flex-col items-center justify-start pt-9 overflow-hidden"
                              style={{
                                backgroundColor:
                                  design.shirtColor || "var(--ink)",
                                zIndex: 2,
                              }}
                            >
                              {/* Neck cut-out */}
                              <div
                                className="absolute -top-4 w-16 h-8 rounded-[50%]"
                                style={{
                                  backgroundColor: "var(--bg)",
                                  boxShadow: "inset 0 -2px 4px rgba(0,0,0,0.3)",
                                }}
                              />

                              {/* Graphic on Layer */}
                              {design.assetType === "portada" ? (
                                <ResolvedBgImage
                                  className="w-24 h-24 rounded-[var(--r-s)] bg-cover bg-center"
                                  url={displayGraphic}
                                />
                              ) : (
                                <div
                                  className="w-28 h-28 bg-contain bg-center bg-no-repeat transition-all"
                                  style={{
                                    backgroundImage: `url(${displayGraphic})`,
                                    filter:
                                      design.assetType === "logo" &&
                                      !isLightColor(
                                        design.shirtColor || "var(--ink)",
                                      )
                                        ? "invert(1)"
                                        : "",
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-[var(--surface)]/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 z-30">
                        <button
                          onClick={() => {
                            const link = document.createElement("a");
                            link.download = `merchan-${cleanBand || "banda"}-${design.id}.png`;
                            link.href = displayGraphic;
                            link.click();
                          }}
                          className={`px-4 py-2 rounded-[var(--r-m)] font-sans text-xs font-bold flex items-center gap-2 transition ${"bg-[var(--acc)] text-[var(--ink)] hover:bg-[var(--surface)]"}`}
                        >
                          <Download className="w-4 h-4" />
                          Descargar Gráfico
                        </button>
                        <button
                          onClick={() => handleDelete(design.id)}
                          className="px-4 py-2 rounded-[var(--r-m)] font-sans text-xs font-bold flex items-center gap-2 bg-[var(--alert)]/90 text-[var(--ink)] hover:bg-[var(--alert)] transition"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </button>
                      </div>

                      <div
                        className={`absolute bottom-3 left-3 px-2 py-1 rounded-[var(--r-s)] text-[9px] font-sans font-bold z-20 ${"bg-[var(--surface)]/90 text-[var(--ink-2)]"}`}
                      >
                        {design.type} •{" "}
                        {design.assetType === "custom"
                          ? "Imagen propia"
                          : design.assetType}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🎁 Modal de Canje de Pegatinas de Bienvenida */}
      {showClaimModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/80 animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-[var(--r-xl)] bg-[var(--surface)]  overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 bg-[var(--sunken)]  flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[var(--r-m)] bg-[var(--acc)]/60 text-[var(--on-acc)] flex items-center justify-center font-bold">
                  <Gift className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black font-display text-[var(--ink)] flex items-center gap-2">
                    <span>Canjear Pack de Pegatinas Gratis</span>
                    <span className="text-[10px] font-sans font-black px-2 py-0.5 rounded bg-[var(--acc)]/60 text-[var(--acc)]/70">
                      100 uds
                    </span>
                  </h3>
                  <p className="text-xs text-[var(--ink-2)]">
                    Regalo oficial de bienvenida para tu banda · Envío gratis
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowClaimModal(false)}
                className="p-2 text-[var(--ink-2)] hover:text-[var(--ink)] rounded-[var(--r-m)] hover:bg-[var(--surface)]/80 transition-colors cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {claimStep === "form" ? (
                <>
                  {/* 1. Previsualización del diseño elegido */}
                  <div className="space-y-3">
                    <label className="text-xs font-sans font-bold text-[var(--ink-2)] flex items-center gap-2">
                      <Palette className="w-4 h-4 text-[var(--acc)]" />
                      <span>1. Previsualización del Diseño Elegido</span>
                    </label>

                    <div className="p-4 rounded-[var(--r-l)] bg-[var(--sunken)] flex flex-col sm:flex-row items-center gap-5">
                      {/* Sticker Preview visual */}
                      <div className="relative w-28 h-28 shrink-0 rounded-[var(--r-l)] bg-[var(--surface)] p-2 flex flex-col items-center justify-center transform -rotate-3">
                        <div className="w-10 h-10 rounded-[var(--r-s)] bg-[var(--acc)]/60 text-[var(--on-acc)] font-black flex items-center justify-center text-lg font-display mb-1">
                          {bandInitials}
                        </div>
                        <span className="text-[9px] font-black font-display text-[var(--ink)]">
                          {displayBandName.toUpperCase()}
                        </span>
                        <span className="text-[7px] font-sans text-[var(--acc)] font-bold">
                          Oficial Vinyl
                        </span>
                      </div>

                      <div className="flex-1 text-center sm:text-left space-y-1">
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                          <span className="text-xs font-bold text-[var(--ink)]">
                            Logo {displayBandName} (Oficial)
                          </span>
                          <span className="text-[10px] font-sans text-[var(--ok)] bg-[var(--ok)]/10 px-2 py-0.5 rounded">
                            Alta resolución 300 DPI
                          </span>
                        </div>
                        <p className="text-xs text-[var(--ink-2)]">
                          Vinilo mate exterior troquelado · 8x8 cm · Resistente
                          al agua, al sol y a fundas de guitarra.
                        </p>
                        <p className="text-[11px] font-sans text-[var(--acc)]/70 pt-1">
                          ✨ Cantidad asignada por tu plan:{" "}
                          <strong>500 unidades</strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2. Formulario de dirección de envío */}
                  <div className="space-y-3 pt-2">
                    <label className="text-xs font-sans font-bold text-[var(--ink-2)] flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[var(--acc)]" />
                      <span>2. Dirección de Envío (España)</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-[var(--r-l)] bg-[var(--sunken)]">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] font-sans text-[var(--ink-2)]">
                          Nombre del Destinatario / Banda
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-[var(--ink-2)] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={shippingForm.nombre}
                            onChange={(e) =>
                              setShippingForm({
                                ...shippingForm,
                                nombre: e.target.value,
                              })
                            }
                            className="w-full pl-9 pr-3 py-2 rounded-[var(--r-m)] bg-[var(--surface)] text-xs font-sans text-[var(--ink)] focus:outline-none focus:"
                            placeholder="Nombre y apellidos"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] font-sans text-[var(--ink-2)]">
                          Calle, número, piso y puerta
                        </label>
                        <div className="relative">
                          <Building className="w-4 h-4 text-[var(--ink-2)] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={shippingForm.direccion}
                            onChange={(e) =>
                              setShippingForm({
                                ...shippingForm,
                                direccion: e.target.value,
                              })
                            }
                            className="w-full pl-9 pr-3 py-2 rounded-[var(--r-m)] bg-[var(--surface)] text-xs font-sans text-[var(--ink)] focus:outline-none focus:"
                            placeholder="Dirección completa del local o domicilio"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-sans text-[var(--ink-2)]">
                          Código Postal (CP)
                        </label>
                        <input
                          type="text"
                          value={shippingForm.cp}
                          onChange={(e) =>
                            setShippingForm({
                              ...shippingForm,
                              cp: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[var(--surface)] text-xs font-sans text-[var(--ink)] focus:outline-none focus:"
                          placeholder="28001"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-sans text-[var(--ink-2)]">
                          Ciudad / Provincia
                        </label>
                        <input
                          type="text"
                          value={shippingForm.ciudad}
                          onChange={(e) =>
                            setShippingForm({
                              ...shippingForm,
                              ciudad: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[var(--surface)] text-xs font-sans text-[var(--ink)] focus:outline-none focus:"
                          placeholder="Madrid"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] font-sans text-[var(--ink-2)]">
                          Teléfono de Contacto (para el mensajero)
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-[var(--ink-2)] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="tel"
                            value={shippingForm.telefono}
                            onChange={(e) =>
                              setShippingForm({
                                ...shippingForm,
                                telefono: e.target.value,
                              })
                            }
                            className="w-full pl-9 pr-3 py-2 rounded-[var(--r-m)] bg-[var(--surface)] text-xs font-sans text-[var(--ink)] focus:outline-none focus:"
                            placeholder="+34 600 000 000"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Pantalla de Confirmación Posterior */
                <div className="py-8 flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-[var(--r-pill)] bg-[var(--ok)]/20 flex items-center justify-center text-[var(--ok)] animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-2xl font-black font-display text-[var(--ink)]">
                      ¡Pedido Recibido con Éxito!
                    </h4>
                    <p className="text-sm font-bold text-[var(--acc)]/70">
                      Te avisamos cuando salga de imprenta.
                    </p>
                    <p className="text-xs text-[var(--ink-2)] max-w-md mx-auto leading-relaxed">
                      Tus 500 pegatinas troqueladas en vinilo mate de alta
                      resistencia entrarán en cola de producción. Recibirás una
                      notificación por email con el número de seguimiento en
                      48-72h.
                    </p>
                  </div>

                  <div className="p-4 rounded-[var(--r-l)] bg-[var(--sunken)] text-left w-full max-w-md space-y-2 text-xs font-sans">
                    <div className="flex items-center justify-between pb-2">
                      <span className="text-[var(--ink-2)]">Destinatario:</span>
                      <span className="text-[var(--ink)] font-bold">
                        {shippingForm.nombre}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pb-2">
                      <span className="text-[var(--ink-2)]">Dirección:</span>
                      <span className="text-[var(--ink)]">
                        {shippingForm.direccion}, {shippingForm.cp}{" "}
                        {shippingForm.ciudad}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pb-2">
                      <span className="text-[var(--ink-2)]">Pack:</span>
                      <span className="text-[var(--acc)] font-bold">
                        500 Pegatinas Vinilo Oficial
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--ink-2)]">Coste total:</span>
                      <span className="text-[var(--ok)] font-bold">
                        0,00 € (Gratis por suscripción)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[var(--bg)] flex items-center justify-between">
              {claimStep === "form" ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowClaimModal(false)}
                    className="px-4 py-2 rounded-[var(--r-m)] text-xs font-sans text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={() => setClaimStep("success")}
                    className="px-6 py-2.5 rounded-[var(--r-m)] bg-[var(--acc)]  hover:bg-[var(--acc)] text-[var(--ink)] text-xs font-black font-sans hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    <PackageCheck className="w-4 h-4" />
                    <span>Pedir mis pegatinas</span>
                  </button>
                </>
              ) : (
                <div className="w-full flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowClaimModal(false);
                      setHasGiftPending(false); // Canjeado
                    }}
                    className="px-6 py-2.5 rounded-[var(--r-m)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink)] text-xs font-sans font-bold cursor-pointer transition-colors"
                  >
                    Entendido, volver al Taller
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
