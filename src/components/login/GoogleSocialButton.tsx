import React from "react";

/** Logotipo de Google en trazo (hereda el color del texto). */
export const GoogleIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="shrink-0"
  >
    <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z" />
  </svg>
);

/** Botón «Continuar con Google» del login y del registro. */
export const SocialButtons: React.FC<{ onClick: () => void; loading: boolean }> = ({ onClick, loading }) => (
  <div className="w-full mt-3">
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2.5 py-3 bg-[var(--surface)]/80 hover:bg-[var(--surface)] rounded-[var(--r-l)] text-sm font-medium text-[var(--ink-2)] hover:text-[var(--ink)] transition-ui cursor-pointer disabled:opacity-50"
    >
      <GoogleIcon />
      <span>{loading ? "Conectando..." : "Continuar con Google"}</span>
    </button>
  </div>
);
