import React from "react";

/** Barra de fuerza de contraseña (3 niveles) con su etiqueta. */
export const PasswordStrengthBar = ({ pass }: { pass: string }) => {
  if (!pass) return null;
  let score = 0;
  if (pass.length >= 6) score += 1;
  if (pass.length >= 8) score += 1;
  if (/[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass)) score += 1;

  const labels = ["Contraseña básica", "Seguridad media", "Muy segura"];
  const colors = [
    "bg-[var(--alert)]",
    "bg-[var(--acc)]",
    "bg-[var(--ok)]",
  ];
  const textColors = [
    "text-[var(--alert)]",
    "text-[var(--acc)]",
    "text-[var(--ok)]",
  ];

  return (
    <div className="space-y-1.5 pt-1 px-0.5">
      <div className="flex gap-1 h-1 w-full bg-[var(--surface)]/80 rounded-[var(--r-pill)] overflow-hidden">
        <div
          className={`h-full transition-ui duration-300 ${score >= 1 ? colors[0] : "bg-transparent"} w-1/3`}
        />
        <div
          className={`h-full transition-ui duration-300 ${score >= 2 ? colors[1] : "bg-transparent"} w-1/3`}
        />
        <div
          className={`h-full transition-ui duration-300 ${score >= 3 ? colors[2] : "bg-transparent"} w-1/3`}
        />
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className={`font-medium ${textColors[Math.max(0, score - 1)]}`}>
          {labels[Math.max(0, score - 1)]}
        </span>
        <span className="text-[var(--ink-2)]">
          {pass.length < 6 ? "Mínimo 6 caracteres" : "✓ Longitud OK"}
        </span>
      </div>
    </div>
  );
};
