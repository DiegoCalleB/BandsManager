/**
 * Selector de idioma del formulario público y su icono de bandera.
 */
import React from "react";
import {
FAN_FORM_LANGUAGES,
FanFormLanguage
} from "../../i18n/fansTranslations";



export const FlagIcon: React.FC<{ code: FanFormLanguage; className?: string }> = ({
  code,
  className = "w-4 h-3",
}) => {
  if (code === "es") {
    return (
      <svg
        className={`${className} rounded-xs object-cover shrink-0`}
        viewBox="0 0 640 480"
      >
        <path fill="#c60b1e" d="M0 0h640v480H0z" />
        <path fill="#ffc400" d="M0 120h640v240H0z" />
      </svg>
    );
  }
  if (code === "en") {
    return (
      <svg
        className={`${className} rounded-xs object-cover shrink-0`}
        viewBox="0 0 640 480"
      >
        <path fill="#012169" d="M0 0h640v480H0z" />
        <path
          fill="#fff"
          d="m75 0 245 180L565 0h75v55L415 240l225 185v55h-75L320 300 75 480H0v-55l225-185L0 55V0z"
        />
        <path
          fill="#c8102e"
          d="m425 240 215 175v25h-35L390 265zm-210 0L0 415v25h35l215-175zm210 0L640 65V40h-35L390 215zm-210 0L0 65V40h35l215 175z"
        />
        <path fill="#fff" d="M240 0v480h160V0zM0 160v160h640V160z" />
        <path fill="#c8102e" d="M270 0v480h100V0zM0 190v100h640V190z" />
      </svg>
    );
  }
  if (code === "it") {
    return (
      <svg
        className={`${className} rounded-xs object-cover shrink-0`}
        viewBox="0 0 640 480"
      >
        <path fill="#009246" d="M0 0h213.3v480H0z" />
        <path fill="#fff" d="M213.3 0h213.4v480H213.3z" />
        <path fill="#ce2b37" d="M426.7 0H640v480H426.7z" />
      </svg>
    );
  }
  if (code === "cs") {
    return (
      <svg
        className={`${className} rounded-xs object-cover shrink-0`}
        viewBox="0 0 640 480"
      >
        <path fill="#d7141a" d="M0 0h640v480H0z" />
        <path fill="#fff" d="M0 0h640v240H0z" />
        <path fill="#11457e" d="M0 0l320 240L0 480z" />
      </svg>
    );
  }
  return null;
};

export const FanFormLanguageSwitcher: React.FC<{
  language: FanFormLanguage;
  onChange: (lang: FanFormLanguage) => void;
  languages: typeof FAN_FORM_LANGUAGES;
}> = ({ language, onChange, languages }) => (
  <div className="flex items-center justify-center gap-1.5">
    {languages.map((l) => (
      <button
        key={l.code}
        type="button"
        onClick={() => onChange(l.code)}
        title={l.label}
        className={`px-2.5 py-1.5 rounded-[var(--r-pill)] text-xs font-sans font-bold flex items-center gap-1.5 transition-ui cursor-pointer ${
          language === l.code
            ? "bg-[var(--acc)]/20  text-[var(--ink)] scale-105"
            : "bg-[var(--surface)]/80 text-[var(--ink-2)] hover:hover:text-[var(--ink)] opacity-80 hover:opacity-100"
        }`}
      >
        <FlagIcon code={l.code} className="w-4 h-3 shrink-0" />
        <span className="">
          {l.code === "en" ? "GB" : l.code.toUpperCase()}
        </span>
      </button>
    ))}
  </div>
);
