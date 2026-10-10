/**
 * Datos personales: nombre, instrumento y color del avatar.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Music,Palette,User as UserIcon } from "lucide-react";
import { InvitarBandaCard } from "../InvitarBandaCard";
import { Input } from "../ui";
import { useUserProfile } from "./UserProfileContext";

/**
 * Datos personales: nombre, instrumento y color del avatar.
 * @returns Sección de interfaz.
 */
export function IdentityFields() {
  const { name, setName, instrument, setInstrument, colors, setAvatarColor, avatarColor, currentUser } = useUserProfile();
  return (
    <>
      <div className="space-y-1">
        <label className="text-xs font-sans font-semibold text-[var(--ink-2)] flex items-center gap-1.5">
          <UserIcon className="w-3.5 h-3.5 text-[var(--ok)]" />
          <span>Nombre completo / apodo</span>
        </label>
        <Input
          size="sm"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre…"
          className="w-full"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-sans font-semibold text-[var(--ink-2)] flex items-center gap-1.5">
          <Music className="w-3.5 h-3.5 text-[var(--ok)]" />
          <span>Instrumento / Puesto</span>
        </label>
        <Input
          size="sm"
          type="text"
          value={instrument}
          onChange={(e) => setInstrument(e.target.value)}
          placeholder="Ej: Violín, Percusión, Batería, Técnico de Sonido"
          className="w-full"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-sans font-semibold text-[var(--ink-2)] flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-[var(--ok)]" />
          <span>Color de Avatar</span>
        </label>
        <div className="flex items-center gap-2 pt-0.5">
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setAvatarColor(c)}
              className={`w-7 h-7 rounded-[var(--r-pill)] transition-transform cursor-pointer ${
                avatarColor === c
                  ? "scale-110  ring-2 ring-[var(--ok)]"
                  : " opacity-75 hover:opacity-100"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {(currentUser?.role === "leader" || currentUser?.role === "admin") && <InvitarBandaCard />}
    </>
  );
}
