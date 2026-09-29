import React from "react";
import { Globe, Phone } from "lucide-react";

export interface SocialLinks {
  spotify?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  facebook?: string;
  twitter?: string;
  appleMusic?: string;
  bandcamp?: string;
  soundcloud?: string;
  bandsintown?: string;
  songkick?: string;
  wegow?: string;
  tidal?: string;
  deezer?: string;
  amazonMusic?: string;
  twitch?: string;
  threads?: string;
  website?: string;
  whatsapp?: string;
  revolut?: string;
  paypal?: string;
  [key: string]: string | undefined;
}

interface SocialPlatformsListProps {
  links?: SocialLinks;
  variant?: "grid" | "pills" | "compact";
  title?: string;
  subtitle?: string;
  showTitle?: boolean;
  language?: string;
  onPlatformClick?: (platform: string, url: string) => void;
  clickCounts?: Record<string, number>;
  showClickCounts?: boolean;
}

export const PayPalLogo: React.FC<{ className?: string }> = ({
  className = "w-full h-full",
}) => (
  <svg
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Front / Top-Left P (Dark Blue #003087) */}
    <path
      d="M21.9 8.2c-.3-1.6-1-2.8-2.2-3.7C18.3 3.4 16.5 3 14.1 3H6.8c-.8 0-1.5.6-1.6 1.4L1.7 26.6c-.1.7.4 1.4 1.1 1.4h5.6l1.4-9h2.9c4.8 0 8.5-2 9.4-7 0-.3.1-.6.1-.9.1-.6 0-1.3-.3-1.9z"
      fill="#003087"
    />
    {/* Back / Bottom-Right P (Light Cyan Blue #0079C1) */}
    <path
      d="M27.2 13.8c-.8 4.7-4.3 6.9-9.1 6.9h-2.8c-.8 0-1.5.6-1.6 1.4l-1.6 10c-.1.7.4 1.4 1.1 1.4h4.8c.8 0 1.5-.6 1.6-1.4l1.3-8.1c.1-.8.8-1.4 1.6-1.4h.6c4.5 0 8-1.8 8.9-6.7.4-2.2.1-4-1-5.3-.4-.5-1-.9-1.7-1.2.2.4.3.9.2 1.4z"
      fill="#0079C1"
    />
    {/* Overlap intersection (Deep Navy #002069) */}
    <path
      d="M24.7 15.2c-.9 5-4.6 7-9.4 7h-2.9l-1.4 9h2.7l1.6-10c.1-.8.8-1.4 1.6-1.4h2.8c4.8 0 8.3-2.2 9.1-6.9.1-.5 0-1-.2-1.4-.8 2.6-2.6 4.3-5.9 4.7z"
      fill="#002069"
    />
  </svg>
);

export const SocialIcons: Record<string, React.FC<{ className?: string }>> = {
  spotify: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.899 4.62-1.02 8.52-.6 11.64 1.32.42.18.479.659.301 1.019zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141 4.38-1.38 9.841-.72 13.56 1.56.36.18.54.78.18 1.261zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72 1.02.42 1.56-.3.42-1.02.6-1.56.3z" />
    </svg>
  ),
  instagram: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  ),
  youtube: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  tiktok: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.27 1.76-.23 1.03.03 2.17.7 2.91.7.77 1.8 1.15 2.83 1.02.97-.09 1.88-.66 2.37-1.52.42-.71.55-1.57.54-2.38.01-4.71.01-9.42 0-14.13z" />
    </svg>
  ),
  appleMusic: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1.5-13.882v6.382c0 1.25-1.12 2.15-2.38 1.95-1.01-.16-1.74-.98-1.74-1.95 0-1.07.87-1.93 1.94-1.93.38 0 .73.11 1.03.29V8.882l5.5-1.38v5.38c0 1.25-1.12 2.15-2.38 1.95-1.01-.16-1.74-.98-1.74-1.95 0-1.07.87-1.93 1.94-1.93.38 0 .73.11 1.03.29V6.25l-7.3 1.868z" />
    </svg>
  ),
  bandcamp: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M0 18.75l7.437-13.5H24l-7.438 13.5H0z" />
    </svg>
  ),
  soundcloud: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M1.175 12.225c-.04 0-.074.032-.08.071L.82 15.01c-.01.066.036.126.102.13.007 0 .013 0 .02-.002l.275-.035c.04 0 .074-.032.08-.071l.275-2.714c.01-.066-.036-.126-.102-.13-.007 0-.013 0-.02.002l-.275.035zm1.53-.787c-.05 0-.094.036-.101.086l-.37 3.518c-.01.076.046.143.122.15.008 0 .017 0 .025-.002l.375-.048c.05 0 .093-.036.1-.086l.37-3.518c.01-.076-.046-.143-.122-.15-.008 0-.017 0-.025.002l-.474.048zm1.56-.81c-.06 0-.112.043-.12.102l-.445 4.34c-.012.088.053.167.142.176.01 0 .02 0 .03-.002l.45-.058c.06 0 .113-.043.12-.102l.446-4.34c.012-.088-.053-.167-.142-.176-.01 0-.02 0-.03.002l-.45.058zm1.57-.394c-.07 0-.13.05-.14.119l-.49 4.743c-.013.1.06.19.16.202.012 0 .024 0 .035-.003l.496-.064c.07 0 .13-.05.14-.118l.49-4.744c.014-.1-.06-.19-.16-.202-.012 0-.023 0-.035.003l-.496.064zm1.58-.292c-.08 0-.15.058-.16.136l-.52 5.045c-.016.112.068.213.18.226.013 0 .027 0 .04-.003l.53-.068c.08 0 .15-.057.16-.135l.52-5.046c.015-.112-.068-.213-.18-.226-.014 0-.027 0-.04.003l-.53.068zm1.59-.16c-.09 0-.17.065-.18.153l-.53 5.216c-.017.123.076.234.198.248.015 0 .03 0 .044-.003l.544-.07c.09 0 .17-.064.18-.152l.53-5.217c.017-.123-.076-.234-.198-.248-.015 0-.03 0-.044.003l-.544.07zm1.61.166c-.1 0-.188.072-.2.17l-.5 5.06c-.02.135.084.256.22.272.016 0 .033 0 .05-.004l.512-.065c.1 0 .188-.073.2-.17l.5-5.06c.02-.135-.084-.256-.22-.272-.016 0-.033 0-.05.003l-.512.066zm5.72-3.865c-.75 0-1.45.242-2.03.655-.13.093-.24.234-.23.393l.11 7.492c0 .127.103.23.23.23h7.68c2.22 0 4.02-1.8 4.02-4.02 0-2.12-1.65-3.86-3.74-4.01-.36-2.67-2.64-4.74-5.42-4.74-.21 0-.42.013-.62.038v-.038z" />
    </svg>
  ),
  bandsintown: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.667 0H5.333C2.388 0 0 2.388 0 5.333v13.334C0 21.612 2.388 24 5.333 24h13.334C21.612 24 24 21.612 24 18.667V5.333C24 2.388 21.612 0 18.667 0zm-3.111 18.222H8.444V5.778h7.112v12.444zm-1.778-3.555h-3.555v-1.778h3.555v1.778zm0-3.556h-3.555V9.333h3.555v1.778z" />
    </svg>
  ),
  songkick: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.5 4.5A2.5 2.5 0 0 0 0 7v10a2.5 2.5 0 0 0 2.5 2.5h19a2.5 2.5 0 0 0 2.5-2.5V7a2.5 2.5 0 0 0-2.5-2.5h-19zm4.25 4.25c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm10.5 0a1 1 0 0 1 1 1v4.5a1 1 0 1 1-2 0V9.75a1 1 0 0 1 1-1zm-4.75 0a1 1 0 0 1 1 1v4.5a1 1 0 1 1-2 0V9.75a1 1 0 0 1 1-1z" />
    </svg>
  ),
  wegow: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm-1 14.5l-4-2.5V9.8l4 2.2v4.5zm2 0v-4.5l4-2.2v4.2l-4 2.5zm4.8-8L12 5.6 6.2 8.5 12 11.4l5.8-2.9z" />
    </svg>
  ),
  tidal: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.012 3.992L8.008 7.996l4.004 4.004 4.004-4.004-4.004-4.004zm-8.004 8.004L0 7.996l4.008-4.004 4.004 4.004-4.004 4.004zm8.004 0l-4.004 4.004 4.004 4.004 4.004-4.004-4.004-4.004zm8.004-8.004l-4.004 4.004 4.004 4.004 4.004-4.004-4.004-4.004z" />
    </svg>
  ),
  deezer: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.02 14.98H2v3.74h4.02v-3.74zm5.99-3.74H8.03v7.48h3.98v-7.48zm5.97-3.74h-3.99v11.22h3.99V7.5zm5.98-3.74h-4v14.96h4V3.76zM6.02 10.02H2v3.74h4.02v-3.74z" />
    </svg>
  ),
  amazonMusic: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.8 2.2c-.3 0-.6.2-.7.5l-.8 2.7c-.1.3.1.6.4.7.9.3 1.6.8 2.1 1.5.5.7.8 1.5.8 2.5 0 2.2-1.8 4-4 4s-4-1.8-4-4c0-1.8 1.2-3.4 3-3.8.3-.1.5-.4.4-.7l-.6-2.5c-.1-.3-.4-.5-.7-.4C5.7 3.5 3 6.7 3 10.5 3 15.2 6.8 19 11.5 19s8.5-3.8 8.5-8.5c0-4.6-3.7-8.3-8.2-8.3zm-8.6 18c3.2 1.6 7 1.8 10.3.5.3-.1.4-.4.2-.7-.2-.2-.5-.3-.7-.2-3 1.2-6.4 1-9.3-.4-.3-.1-.6 0-.7.3-.2.3 0 .6.2.8z" />
    </svg>
  ),
  twitch: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
    </svg>
  ),
  threads: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 18.2c-3.4 0-5.8-2.3-5.8-5.7 0-3.6 2.6-6 6.3-6 3.6 0 5.7 2.3 5.7 5.4 0 3.2-1.9 5.2-4.5 5.2-1.3 0-2.3-.6-2.7-1.6h-.1c-.4.9-1.3 1.6-2.5 1.6-1.5 0-2.5-.9-2.5-2.4 0-1.7 1.4-2.8 3.5-2.8h1.4v-.6c0-1.3-.9-2-2.3-2-1.1 0-2 .5-2.3 1.2l-1.3-.7c.5-1.2 1.9-2 3.7-2 2.3 0 3.8 1.3 3.8 3.3v4.6c0 .7.4 1.1 1.1 1.1 1.5 0 2.6-1.3 2.6-3.5 0-2.3-1.4-3.9-4-3.9-2.7 0-4.5 1.8-4.5 4.3 0 2.4 1.6 4.1 4.1 4.1 1.4 0 2.5-.5 3.2-1.3l1 1.1c-1 1-2.4 1.7-4.2 1.7zm-.6-6.4c-1.1 0-1.8.6-1.8 1.5 0 .8.5 1.3 1.3 1.3.8 0 1.4-.5 1.7-1.2v-.8l-1.2-.8z" />
    </svg>
  ),
  facebook: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  twitter: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  revolut: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.72 9.24c-.06-.5-.2-.98-.44-1.42a4.43 4.43 0 0 0-1.12-1.3A4.78 4.78 0 0 0 15.5 5.6c-.63-.23-1.3-.35-1.98-.35H6.28v2.75h7.24c.72 0 1.39.28 1.9.79.5.5.79 1.18.79 1.9 0 .73-.29 1.4-.79 1.91-.51.5-1.18.78-1.9.78h-3.3v2.8h2.64l4.28 7.82h3.28l-4.14-7.57a4.93 4.93 0 0 0 2.94-4.23zM6.28 10.3v13.7h2.75V10.3H6.28z" />
    </svg>
  ),
  paypal: ({ className = "w-5 h-5" }) => <PayPalLogo className={className} />,
  website: Globe,
  whatsapp: Phone,
};

export const PLATFORM_CONFIG: Record<
  string,
  {
    label: string;
    colorClass: string;
    bgClass: string;
    borderClass: string;
    hoverClass: string;
  }
> = {
  spotify: {
    label: "Spotify",
    colorClass: "text-[var(--ok)]",
    bgClass: "bg-[var(--ok)]/10",
    borderClass: "",
    hoverClass: "hover:bg-[var(--ok)]/20 hover:text-[var(--ink-2)]",
  },
  instagram: {
    label: "Instagram",
    colorClass: "text-[var(--alert)]",
    bgClass:
      "bg-gradient-to-r from-[var(--acc)]/10 via-[var(--acc)]/10 to-[var(--acc)]/10",
    borderClass: "border-[var(--alert)]/30",
    hoverClass:
      "hover:from-[var(--acc)]/20 hover:via-[var(--acc)]/20 hover:to-[var(--acc)]/20 hover:border-[var(--alert)]/50 hover:text-[var(--alert)]/60",
  },
  youtube: {
    label: "YouTube",
    colorClass: "text-[var(--alert)]",
    bgClass: "bg-[var(--alert)]/10",
    borderClass: "",
    hoverClass: "hover:bg-[var(--alert)]/20 hover:text-[var(--alert)]/60",
  },
  tiktok: {
    label: "TikTok",
    colorClass: "text-[var(--acc)]",
    bgClass: "bg-[var(--acc)]/10",
    borderClass: "",
    hoverClass: "hover:bg-[var(--acc)]/20 hover:text-[var(--acc)]/80",
  },
  appleMusic: {
    label: "Apple Music",
    colorClass: "text-[var(--alert)]",
    bgClass: "bg-[var(--alert)]/10",
    borderClass: "",
    hoverClass: "hover:bg-[var(--alert)]/20 hover:text-[var(--ink-2)]",
  },
  bandcamp: {
    label: "Bandcamp",
    colorClass: "text-[var(--ok)]",
    bgClass: "bg-[var(--ok)]/10",
    borderClass: "",
    hoverClass: "hover:bg-[var(--ok)]/20 hover:text-[var(--ok)]/60",
  },
  soundcloud: {
    label: "SoundCloud",
    colorClass: "text-[var(--acc)]",
    bgClass: "bg-[var(--acc)]/10",
    borderClass: "border-[var(--acc)]/30",
    hoverClass:
      "hover:bg-[var(--acc)]/20 hover:border-[var(--acc)]/50 hover:text-[var(--acc)]",
  },
  bandsintown: {
    label: "Bandsintown",
    colorClass: "text-[var(--acc)]",
    bgClass: "bg-[var(--acc)]/10",
    borderClass: "border-[var(--acc)]/30",
    hoverClass:
      "hover:bg-[var(--acc)]/20 hover:border-[var(--acc)]/50 hover:text-[var(--acc)]",
  },
  songkick: {
    label: "Songkick",
    colorClass: "text-[var(--alert)]",
    bgClass: "bg-[var(--alert)]/10",
    borderClass: "border-[var(--alert)]/30",
    hoverClass:
      "hover:bg-[var(--alert)]/20 hover:border-[var(--alert)]/50 hover:text-[var(--alert)]",
  },
  wegow: {
    label: "Wegow",
    colorClass: "text-[var(--acc)]",
    bgClass: "bg-[var(--acc)]/10",
    borderClass: "border-[var(--acc)]/30",
    hoverClass:
      "hover:bg-[var(--acc)]/20 hover:border-[var(--acc)]/50 hover:text-[var(--acc)]",
  },
  tidal: {
    label: "TIDAL",
    colorClass: "text-[var(--ink-2)]",
    bgClass: "bg-[var(--surface)]",
    borderClass: "border-[var(--hair)]",
    hoverClass: "hover:bg-[var(--surface)] hover:border-[var(--hair)] hover:text-[var(--ink)]",
  },
  deezer: {
    label: "Deezer",
    colorClass: "text-[var(--acc)]",
    bgClass: "bg-[var(--acc)]/10",
    borderClass: "border-[var(--acc)]/30",
    hoverClass:
      "hover:bg-[var(--acc)]/20 hover:border-[var(--acc)]/50 hover:text-[var(--acc)]",
  },
  amazonMusic: {
    label: "Amazon Music",
    colorClass: "text-[var(--acc)]",
    bgClass: "bg-[var(--acc)]/10",
    borderClass: "border-[var(--acc)]/30",
    hoverClass:
      "hover:bg-[var(--acc)]/20 hover:border-[var(--acc)]/50 hover:text-[var(--acc)]",
  },
  twitch: {
    label: "Twitch",
    colorClass: "text-[var(--acc)]",
    bgClass: "bg-[var(--acc)]/10",
    borderClass: "border-[var(--acc)]/30",
    hoverClass:
      "hover:bg-[var(--acc)]/20 hover:border-[var(--acc)]/50 hover:text-[var(--acc)]",
  },
  threads: {
    label: "Threads",
    colorClass: "text-[var(--ink-2)]",
    bgClass: "bg-[var(--surface)]/90",
    borderClass: "border-[var(--hair)]",
    hoverClass: "hover:bg-[var(--surface)] hover:border-[var(--hair)] hover:text-[var(--ink)]",
  },
  facebook: {
    label: "Facebook",
    colorClass: "text-[var(--acc)]",
    bgClass: "bg-[var(--tentative)]/50",
    borderClass: "border-[var(--acc)]/30",
    hoverClass:
      "hover:bg-[var(--tentative)]/50 hover:border-[var(--acc)]/50 hover:text-[var(--acc)]/80",
  },
  twitter: {
    label: "X / Twitter",
    colorClass: "text-[var(--ink-2)]",
    bgClass: "bg-[var(--surface)]/80",
    borderClass: "",
    hoverClass: "hover:bg-[var(--surface)] hover:hover:text-[var(--ink)]",
  },
  website: {
    label: "Sitio Web",
    colorClass: "text-[var(--acc)]",
    bgClass: "bg-[var(--acc)]/10",
    borderClass: "",
    hoverClass: "hover:bg-[var(--acc)]/20  hover:text-[var(--acc)]/70",
  },
  revolut: {
    label: "Revolut",
    colorClass: "text-[var(--ink-2)]",
    bgClass: "bg-[var(--acc)]/10",
    borderClass: "",
    hoverClass: "hover:bg-[var(--acc)]/20 hover:text-[var(--tentative)]/40",
  },
  paypal: {
    label: "PayPal",
    colorClass: "text-[var(--ink-2)]",
    bgClass: "bg-[var(--bg)]/15",
    borderClass: "border-[var(--hair)]/40",
    hoverClass:
      "hover:bg-[var(--bg)]/25 hover:border-[var(--hair)]/60 hover:text-[var(--ink-2)]",
  },
  whatsapp: {
    label: "WhatsApp",
    colorClass: "text-[var(--ok)]",
    bgClass: "bg-[var(--ok)]/10",
    borderClass: "",
    hoverClass: "hover:bg-[var(--ok)]/20 hover:text-[var(--ink-2)]",
  },
};

// Orden de prioridad explícito solicitado para los enlaces públicos:
// 1º Instagram, 2º YouTube, 3º Spotify, 4º TikTok, 5º Facebook, y después el resto (WhatsApp, Revolut y PayPal excluidos de redes)
export const PLATFORM_PRIORITY_ORDER: string[] = [
  "instagram",
  "youtube",
  "spotify",
  "soundcloud",
  "bandsintown",
  "songkick",
  "wegow",
  "tiktok",
  "appleMusic",
  "bandcamp",
  "tidal",
  "deezer",
  "amazonMusic",
  "facebook",
  "twitter",
  "threads",
  "twitch",
  "website",
];

// Métodos de pago y mensajería privada que NO deben aparecer entre los enlaces de redes sociales
const NON_SOCIAL_KEYS = new Set(["whatsapp", "revolut", "paypal", "bizum"]);

export const SocialPlatformsList: React.FC<SocialPlatformsListProps> = ({
  links,
  variant = "grid",
  title = "Síguenos en nuestras plataformas",
  subtitle,
  showTitle = true,
  language = "es",
  onPlatformClick,
  clickCounts,
  showClickCounts = false,
}) => {
  if (!links) return null;

  const getWebsiteLabel = () => {
    switch (language) {
      case "en":
        return "Website";
      case "it":
        return "Sito Web";
      case "cs":
        return "Oficiální web";
      default:
        return "Sitio Web";
    }
  };

  const getDefaultSubtitle = () => {
    switch (language) {
      case "en":
        return "Join our community and listen to our live music";
      case "it":
        return "Unisciti alla nostra community e ascolta la nostra musica dal vivo";
      case "cs":
        return "Připoj se k naší komunitě a poslouchej naši hudbu";
      default:
        return "Únete a nuestra comunidad y escucha nuestra música en directo";
    }
  };

  // Filtrar estrictamente solo aquellas redes que tengan una URL válida, rellena y NO sean métodos de pago (Revolut, PayPal) ni WhatsApp
  const validEntries = Object.entries(links)
    .filter(
      ([key, url]) =>
        !NON_SOCIAL_KEYS.has(key.toLowerCase()) &&
        url &&
        typeof url === "string" &&
        url.trim() !== "",
    )
    .sort(([keyA], [keyB]) => {
      const indexA = PLATFORM_PRIORITY_ORDER.indexOf(keyA);
      const indexB = PLATFORM_PRIORITY_ORDER.indexOf(keyB);
      const weightA = indexA === -1 ? 999 : indexA;
      const weightB = indexB === -1 ? 999 : indexB;
      return weightA - weightB;
    });

  if (validEntries.length === 0) return null;

  if (variant === "pills") {
    return (
      <div className="space-y-2">
        {showTitle && (
          <p className="text-xs text-[var(--ink-2)] font-semibold tracking-wider text-center">
            {title}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {validEntries.map(([key, url]) => {
            const config = PLATFORM_CONFIG[key] || {
              label: key === "website" ? getWebsiteLabel() : key,
              colorClass: "text-[var(--ink-2)]",
              bgClass: "bg-[var(--surface)]",
              borderClass: "",
              hoverClass: "hover:bg-[var(--surface)]",
            };
            const label = key === "website" ? getWebsiteLabel() : config.label;
            const IconComp = SocialIcons[key] || Globe;
            const count = clickCounts?.[key.toLowerCase()];

            return (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onPlatformClick?.(key, url)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${config.bgClass} ${config.borderClass} ${config.colorClass} ${config.hoverClass}`}
              >
                <IconComp className="w-4 h-4 shrink-0" />
                <span>{label}</span>
                {showClickCounts && typeof count === "number" && count > 0 && (
                  <span className="text-[10px] font-sans px-1.5 py-0.2 rounded-full bg-[var(--sunken)] text-[var(--ink-2)]">
                    {count}
                  </span>
                )}
              </a>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showTitle && (
        <div className="text-center">
          <p className="text-xs text-[var(--acc)] font-bold tracking-wider">
            {title}
          </p>
          <p className="text-[11px] text-[var(--ink-2)] mt-0.5">
            {subtitle || getDefaultSubtitle()}
          </p>
        </div>
      )}

      {/* Cuadrícula adaptativa */}
      <div
        className={`grid gap-2.5 ${
          validEntries.length === 1
            ? "grid-cols-1"
            : validEntries.length === 2
              ? "grid-cols-2"
              : validEntries.length === 3
                ? "grid-cols-2"
                : "grid-cols-2 sm:grid-cols-3"
        }`}
      >
        {validEntries.map(([key, url], index) => {
          const isOddThree = validEntries.length === 3;
          const isFirstItem = index === 0;
          const isFullWidth = isOddThree && isFirstItem;
          const fullWidthClass = isFullWidth ? "col-span-2" : "";

          const config = PLATFORM_CONFIG[key] || {
            label: key === "website" ? getWebsiteLabel() : key,
            colorClass: "text-[var(--ink-2)]",
            bgClass: "bg-[var(--surface)]",
            borderClass: "",
            hoverClass: "hover:bg-[var(--surface)]",
          };
          const label = key === "website" ? getWebsiteLabel() : config.label;
          const IconComp = SocialIcons[key] || Globe;
          const count = clickCounts?.[key.toLowerCase()];

          return (
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onPlatformClick?.(key, url)}
              className={`flex items-center justify-center gap-2.5 p-3 rounded-[var(--r-m)] text-xs font-bold transition-all duration-200 group ${fullWidthClass} ${config.bgClass} ${config.borderClass} ${config.colorClass} ${config.hoverClass}`}
            >
              <IconComp className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span
                className={
                  isFullWidth ? "text-sm font-black tracking-wide" : "truncate"
                }
              >
                {label}
              </span>
              {showClickCounts && typeof count === "number" && count > 0 && (
                <span className="text-[10px] font-sans px-1.5 py-0.5 rounded-full bg-[var(--sunken)] text-[var(--ink-2)] shrink-0 ml-auto">
                  {count}
                </span>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
};

export const BizumLogo: React.FC<{ className?: string }> = ({
  className = "w-full h-full",
}) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="9" cy="8" r="2.5" fill="currentColor" />
    <circle cx="16" cy="18" r="2.5" fill="currentColor" />
    <path
      d="M10.5 19 L14.5 7"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
  </svg>
);
