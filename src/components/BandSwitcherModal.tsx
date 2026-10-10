/**
 * Selector de bandas del usuario: cambiar, ordenar, fijar principal, salir y crear.
 * Orquesta controlador, contexto y vista; la lógica vive en `band_switcher/` (AGENTS.md §5.6).
 */
import React from "react";
import type { User } from "../types";
import { BandSwitcherLayout } from "./band_switcher/BandSwitcherLayout";
import { BandSwitcherProvider } from "./band_switcher/BandSwitcherProvider";
import type { SwitcherBand,SwitcherEpkConfig } from "./band_switcher/bandSwitcherTypes";
import { useBandSwitcherController } from "./band_switcher/hooks/useBandSwitcherController";

export interface BandSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  availableBands: SwitcherBand[];
  onSwitchBand: (bandId: string) => Promise<unknown>;
  onSetMainBand?: (bandId: string) => Promise<unknown>;
  onOpenRegisterBand?: () => void;
  onOpenBandManagement?: (bandId?: string) => void;
  epkConfig?: SwitcherEpkConfig;
  onUpdateEpkConfig?: (config: SwitcherEpkConfig) => Promise<unknown> | void;
  onRefreshData?: () => void;
}

/**
 * Selector de bandas del usuario.
 * @param props Usuario, bandas disponibles y callbacks de cambio, principal y refresco.
 * @returns El modal con su contexto, o nada si está cerrado.
 */
export const BandSwitcherModal: React.FC<BandSwitcherModalProps> = (props) => {
  const controller = useBandSwitcherController({ currentUser: props.currentUser, availableBands: props.availableBands, epkConfig: props.epkConfig, onSwitchBand: props.onSwitchBand, onRefreshData: props.onRefreshData, onSetMainBand: props.onSetMainBand, onUpdateEpkConfig: props.onUpdateEpkConfig, onClose: props.onClose });

  if (!props.isOpen) return null;

  return (
    <BandSwitcherProvider value={{ ...controller, ...props }}>
      <BandSwitcherLayout />
    </BandSwitcherProvider>
  );
};
