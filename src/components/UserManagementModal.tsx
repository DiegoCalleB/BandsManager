import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Key,
  Trash2,
  Shield,
  Music,
  X,
  Check,
  AlertCircle,
  Edit2,
  RefreshCw,
  Link2,
  Upload,
  ImageIcon,
  Loader2,
} from "lucide-react";
import { User, UserRole } from "../types";
import { ModalPortal } from "./common/ModalPortal";
import {
  STEM_INSTRUMENT_CATEGORIES,
  NON_STEM_ROLES,
} from "../config/stemInstruments";
import { uploadFileToServer } from "../utils/audioStorage";
import { textOnColor } from '../utils/contrastText';
import { Button, IconButton, Input, Select } from './ui';

interface UserManagementModalProps {
  currentUser: User;
  users: User[];
  onClose: () => void;
  onRefreshUsers: () => void;
  bandId?: string;
  bandName?: string;
  bandLogoUrl?: string;
  onRefreshData?: () => void;
  onUpdateLogo?: (newUrl: string) => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  currentUser,
  users,
  onClose,
  onRefreshUsers,
  bandId,
  bandName,
  bandLogoUrl,
  onRefreshData,
  onUpdateLogo,
}) => {
  const [activeTab, setActiveTab] = useState<
    "band_info" | "list" | "create" | "associate"
  >("list");
  const targetBandId = bandId || currentUser.band_id || "";
  const [localLogo, setLocalLogo] = useState<string>(bandLogoUrl || "");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  useEffect(() => {
    if (bandLogoUrl) {
      setLocalLogo(bandLogoUrl);
    }
  }, [bandLogoUrl]);

  const handleUploadLogoLocal = async (file: File) => {
    setIsUploadingLogo(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const uploadedUrl = await uploadFileToServer(file, {
        bandId: targetBandId,
        category: "logo",
      });
      const authHeaders = getHeaders();
      const res = await fetch("/api/users/upload-logo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
          "x-band-id": targetBandId,
        },
        body: JSON.stringify({
          bandId: targetBandId,
          logoUrl: uploadedUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al guardar el logotipo");
      }

      setLocalLogo(uploadedUrl);
      if (onUpdateLogo) {
        onUpdateLogo(uploadedUrl);
      }
      if (onRefreshData) {
        onRefreshData();
      }
      setSuccessMsg("¡Logotipo de la banda actualizado con éxito!");
    } catch (err: any) {
      console.error("Error uploading logo in UserManagementModal:", err);
      setError(err.message || "Error al subir el logo");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // New user form state
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("member");
  const [newInstrument, setNewInstrument] = useState("");
  const [newAvatarColor, setNewAvatarColor] = useState("#3b82f6");

  // Associate existing user form state
  const [assocEmail, setAssocEmail] = useState("");
  const [assocRole, setAssocRole] = useState<UserRole>("member");
  const [assocInstrument, setAssocInstrument] = useState("");

  // Helper for Authorization Headers
  const getHeaders = () => {
    const token = localStorage.getItem("bakandeya_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // Change password state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [changePasswordValue, setChangePasswordValue] = useState("");

  // Status feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const colors = [
    "var(--ok)", // Emerald'#3b82f6', // Blue'#ec4899', // Pink'var(--acc)', // Amber'var(--acc)', // Purple'#06b6d4', // Cyan'#f97316', // Orange'#ef4444' // Red
  ];

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newUsername.trim() ||
      !newEmail.trim() ||
      !newName.trim() ||
      !newPassword
    ) {
      setError("Por favor, completa usuario, email, nombre real y contraseña.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          username: newUsername.trim(),
          email: newEmail.trim(),
          name: newName.trim(),
          password: newPassword,
          role: newRole,
          instrument: newInstrument.trim(),
          avatarColor: newAvatarColor,
          band_id: currentUser.band_id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear usuario");
      }

      setSuccessMsg(`¡Usuario @${data.username} creado con éxito!`);
      setNewUsername("");
      setNewEmail("");
      setNewName("");
      setNewPassword("");
      setNewInstrument("");
      onRefreshUsers();
      setActiveTab("list");
    } catch (err: any) {
      setError(err.message || "Error en el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleAssociateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assocEmail) {
      setError("Por favor, ingresa el email del músico.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch("/api/users/associate", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          email: assocEmail.trim(),
          role: assocRole,
          instrument: assocInstrument.trim(),
        }),
      });

      let data: any = {};
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(
          `Error en el servidor (${response.status}): ${text.slice(0, 100)}`,
        );
      }

      if (!response.ok) {
        throw new Error(data.error || "Error al asociar músico");
      }

      setSuccessMsg(
        `¡Músico ${data.name} (@${data.username}) asociado con éxito!`,
      );
      setAssocEmail("");
      setAssocInstrument("");
      onRefreshUsers();
      setActiveTab("list");
    } catch (err: any) {
      setError(err.message || "Error en el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (
    userId: string,
    newRole: UserRole,
    username: string,
  ) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar el rol");
      }

      setSuccessMsg(
        `Rol cambiado a ${newRole === "leader" ? "Admin / Mánager" : "Miembro (Músico)"} para @${username}`,
      );
      onRefreshUsers();
    } catch (err: any) {
      setError(err.message || "Error al actualizar rol");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (userId: string) => {
    if (!changePasswordValue || changePasswordValue.trim().length < 3) {
      setError("La nueva contraseña debe tener al menos 3 caracteres.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ newPassword: changePasswordValue.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar contraseña");
      }

      setSuccessMsg(`Contraseña actualizada para @${data.username}`);
      setEditingUserId(null);
      setChangePasswordValue("");
      onRefreshUsers();
    } catch (err: any) {
      setError(err.message || "Error en el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (
      !window.confirm(`¿Estás seguro de eliminar el acceso para @${username}?`)
    ) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al eliminar usuario");
      }

      setSuccessMsg(`Usuario @${username} eliminado correctamente.`);
      onRefreshUsers();
    } catch (err: any) {
      setError(err.message || "Error al eliminar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal isOpen={true} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/80 overflow-y-auto overscroll-contain animate-in fade-in duration-300">
        <div
          className={`w-full max-w-2xl rounded-[var(--r-l)] overflow-hidden flex flex-col my-auto max-h-[90vh] bg-[var(--surface)] text-[var(--ink)]`}
        >
          <datalist id="instrument-suggestions">
            {STEM_INSTRUMENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat} />
            ))}
            {NON_STEM_ROLES.map((role) => (
              <option key={role} value={role} />
            ))}
          </datalist>
          {/* Modal Header */}
          <div
            className={`px-6 py-4 flex justify-between items-center bg-[var(--bg)]`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-[var(--r-m)] bg-[var(--tentative)]/10 text-[var(--tentative)] flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold font-display text-base flex items-center gap-2">
                  <span>Gestión de miembros de la banda</span>
                  <span className="text-micro font-sans px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc)]/15 text-[var(--ink)] ">
                    Panel Admin
                  </span>
                </h3>
                <p className="text-xs text-[var(--ink-2)] font-sans">
                  Crea cuentas, administra roles y gestiona contraseñas para el
                  equipo
                </p>
              </div>
            </div>
            <IconButton
              label="Cerrar"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </IconButton>
          </div>

          {/* Tab Selection */}
          <div className={`px-6 pt-3 flex gap-2 shrink-0 overflow-x-auto bg-[var(--bg)]/50`}>
            <button
              onClick={() => {
                setActiveTab("band_info");
                setError(null);
                setSuccessMsg(null);
              }}
              className={`px-4 py-2 text-xs font-bold font-mono tracking-wider transition-ui flex items-center gap-1.5 shrink-0 ${
                activeTab === "band_info"
                  ? "text-[var(--acc-ink)] border-b-2 border-[var(--hair)]"
                  : "text-[var(--ink-2)] hover:text-[var(--ink)]"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Info y logo de banda</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("list");
                setError(null);
                setSuccessMsg(null);
              }}
              className={`px-4 py-2 text-xs font-bold font-sans transition-ui flex items-center gap-1.5 shrink-0 ${
                activeTab === "list"
                  ? " text-[var(--tentative)]"
                  : " text-[var(--ink-2)] hover:text-[var(--ink-2)]"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Lista de Miembros ({users.length})</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("create");
                setError(null);
                setSuccessMsg(null);
              }}
              className={`px-4 py-2 text-xs font-bold font-sans transition-ui flex items-center gap-1.5 shrink-0 ${
                activeTab === "create"
                  ? " text-[var(--tentative)]"
                  : " text-[var(--ink-2)] hover:text-[var(--ink-2)]"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Nuevo músico</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("associate");
                setError(null);
                setSuccessMsg(null);
              }}
              className={`px-4 py-2 text-xs font-bold font-sans transition-ui flex items-center gap-1.5 shrink-0 ${
                activeTab === "associate"
                  ? "text-[var(--tentative)]"
                  : "text-[var(--ink-2)] hover:text-[var(--ink-2)]"
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Asociar músico</span>
            </button>
          </div>

          {/* Messages */}
          <div className="px-6 pt-3">
            {error && (
              <div className="p-3 bg-[var(--alert)]/10 rounded-[var(--r-m)] text-xs text-[var(--alert)] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-[var(--ok)]/10 rounded-[var(--r-m)] text-xs text-[var(--ok)] flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
          </div>

          {/* Tab Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {activeTab === "band_info" ? (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Band Logo Section */}
                <div className="p-5 rounded-[var(--r-m)] bg-[var(--sunken)]/70 space-y-4 ">
                  <div>
                    <h4 className="font-bold text-sm text-[var(--ink)] flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[var(--acc-ink)]" />
                      <span>Logotipo oficial de la banda</span>
                    </h4>
                    <p className="text-xs text-[var(--ink-2)] mt-0.5">
                      Este logo se muestra en el selector de proyectos, tu
                      Dossier EPK y encabezados.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-5 pt-2">
                    {/* Logo Box */}
                    <div className="relative w-24 h-24 rounded-[var(--r-m)] bg-[var(--scrim)]/90 flex items-center justify-center p-2.5 overflow-hidden shrink-0">
                      {localLogo ? (
                        <img
                          src={localLogo}
                          alt={
                            bandName ||
                            currentUser.bandName ||
                            "Logo de la banda"
                          }
                          className="w-full h-full object-contain filter "
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-[var(--acc-ink)] gap-1">
                          <Music className="w-8 h-8 opacity-70" />
                          <span className="text-micro font-bold font-mono text-[var(--ink-2)] ">
                            Sin Logo
                          </span>
                        </div>
                      )}

                      {isUploadingLogo && (
                        <div className="absolute inset-0 bg-[var(--scrim)]/85 flex flex-col items-center justify-center text-[var(--on-scrim)] gap-1.5 z-20">
                          <Loader2 className="w-6 h-6 animate-spin text-[var(--acc-ink)]" />
                          <span className="text-micro font-mono text-[var(--acc-ink)] font-bold ">
                            Subiendo
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Upload Action */}
                    <div className="flex-1 space-y-2.5 text-center sm:text-left">
                      <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--r-s)] bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] font-bold text-xs transition-ui cursor-pointer active:scale-[0.97]">
                        <Upload className="w-4 h-4" />
                        <span>
                          {isUploadingLogo
                            ? "Guardando logotipo..."
                            : "Subir o Cambiar Logo"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isUploadingLogo}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              await handleUploadLogoLocal(file);
                            }
                          }}
                        />
                      </label>
                      <p className="text-xs text-[var(--ink-2)] leading-relaxed font-sans">
                        Formatos soportados: PNG, JPG, WebP o SVG. Se recomienda
                        fondo transparente.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Band Basic Info */}
                <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)]/60 text-xs space-y-3">
                  <h4 className="font-bold text-xs font-mono text-[var(--acc-ink)]/90">
                    Detalles del proyecto
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-2.5 rounded-[var(--r-s)] bg-[var(--sunken)]/80 ">
                      <span className="text-[var(--ink-2)] block text-micro font-mono ">
                        Nombre de la banda
                      </span>
                      <span className="font-bold text-[var(--ink)] text-sm">
                        {bandName || currentUser.bandName || "Mi Banda"}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-[var(--r-s)] bg-[var(--sunken)]/80 ">
                      <span className="text-[var(--ink-2)] block text-micro font-mono ">
                        Total de músicos
                      </span>
                      <span className="font-bold text-[var(--ink)] text-sm">
                        {users.length} miembros registrados
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === "list" ? (
              <div className="space-y-3">
                {users.map((u) => {
                  const isLeader = u.role === "leader";
                  const isSelf = u.id === currentUser.id;
                  const isEditingThisUser = editingUserId === u.id;

                  return (
                    <div
                      key={u.id}
                      className={`p-4 rounded-[var(--r-m)] transition-ui bg-[var(--sunken)]`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-[var(--r-pill)] flex items-center justify-center font-bold text-[var(--ink)] font-sans text-sm shrink-0"
                            style={{
                              backgroundColor: u.avatarColor || "var(--ok)", color: textOnColor(u.avatarColor || "var(--ok)"),
                            }}
                          >
                            {u.name.slice(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <strong className="font-bold text-sm font-sans">
                                {u.name}
                              </strong>
                              <span className="text-xs text-[var(--ink-2)] font-sans">
                                @{u.username}
                              </span>
                              {isLeader ? (
                                <span className="px-2 py-0.5 text-micro font-sans font-bold rounded bg-[var(--acc)]/15 text-[var(--acc-ink)] flex items-center gap-1">
                                  <Shield className="w-2.5 h-2.5" />
                                  <span>Admin</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-micro font-sans font-bold rounded bg-[var(--acc)]/15 text-[var(--ink)] ">
                                  Miembro
                                </span>
                              )}
                              {isSelf && (
                                <span className="px-1.5 py-0.5 text-micro font-sans rounded bg-[var(--surface)]/15 text-[var(--ok)]">
                                  Tú
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[var(--ink-2)] flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Music className="w-3 h-3 text-[var(--ok)]" />
                                <span>{u.instrument || "Músico"}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* User Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Role Select Dropdown */}
                          <Select
                            size="sm"
                            value={u.role || "member"}
                            onChange={(e) =>
                              handleChangeRole(
                                u.id,
                                e.target.value as UserRole,
                                u.username,
                              )
                            }
                            disabled={loading || isSelf}
                            title={
                              isSelf
                                ? "No puedes cambiar tu propio rol desde aquí"
                                : "Cambiar rol del usuario"
                            }
                          >
                            <option
                              value="member"
                              className="bg-[var(--surface)] text-[var(--ink-2)]"
                            >
                              Rol: Miembro
                            </option>
                            <option
                              value="leader"
                              className="bg-[var(--surface)] text-[var(--acc)]/70"
                            >
                              Rol: Admin
                            </option>
                          </Select>

                          <Button
                            variant="ghost"
                            size="xs"
                            type="button"
                            onClick={() => {
                              if (isEditingThisUser) {
                                setEditingUserId(null);
                              } else {
                                setEditingUserId(u.id);
                                setChangePasswordValue("");
                              }
                            }}
                            className="items-center gap-1"
                          >
                            <Key className="w-3 h-3 text-[var(--acc)]" />
                            <span>
                              {isEditingThisUser ? "Cancelar" : "Contraseña"}
                            </span>
                          </Button>

                          {!isSelf && (
                            <IconButton
                              label="Eliminar usuario"
                              variant="danger"
                              type="button"
                              onClick={() => handleDeleteUser(u.id, u.username)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </IconButton>
                          )}
                        </div>
                      </div>

                      {/* Quick Password Reset Subform */}
                      {isEditingThisUser && (
                        <div className="mt-3 pt-3 bg-[var(--surface)]/80 flex items-center gap-2 animate-in fade-in duration-200">
                          <Input
                            size="sm"
                            type="text"
                            value={changePasswordValue}
                            onChange={(e) =>
                              setChangePasswordValue(e.target.value)
                            }
                            placeholder="Nueva contraseña secreta…"
                            className="flex-1"
                          />
                          <Button
                            variant="primary"
                            size="xs"
                            type="button"
                            onClick={() => handleChangePassword(u.id)}
                            disabled={loading}
                            className="items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Guardar</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : activeTab === "create" ? (
              /* Create User Form */
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-sans font-semibold text-[var(--ink-2)]">
                      Usuario (para login) *
                    </label>
                    <Input
                      size="sm"
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="Ej: pablo, carlos, ana"
                      className="w-full"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-sans font-semibold text-[var(--ink-2)]">
                      Email *
                    </label>
                    <Input
                      size="sm"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Ej: pablo@gmail.com"
                      className="w-full"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-sans font-semibold text-[var(--ink-2)]">
                      Nombre completo *
                    </label>
                    <Input
                      size="sm"
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Ej: Pablo (Violín / Sintetizador)"
                      className="w-full"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-sans font-semibold text-[var(--ink-2)]">
                      Contraseña inicial *
                    </label>
                    <Input
                      size="sm"
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Contraseña del usuario"
                      className="w-full"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-sans font-semibold text-[var(--ink-2)]">
                    Rol en la App
                  </label>
                  <Select size="sm" aria-label="Rol en la App"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    wrapperClassName="w-full"
                  >
                    <option value="member">Miembro de banda (Músico)</option>
                    <option value="leader">Admin / dirección de banda</option>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-sans font-semibold text-[var(--ink-2)]">
                    Instrumento / Puesto
                  </label>
                  <Input
                    size="sm"
                    type="text"
                    list="instrument-suggestions"
                    value={newInstrument}
                    onChange={(e) => setNewInstrument(e.target.value)}
                    placeholder="Ej: Violín, Percusión, Batería, Sintetizador, Técnico de Sonido"
                    className="w-full"
                  />
                  <p className="text-micro text-[var(--ink-2)]">
                    Usa uno de los nombres sugeridos (Voz, Batería, Bajo,
                    Guitarras, Teclados, Arreglos) para que el modo Ensayo
                    Individual y Mi Monitor encuentren su pista aislada
                    automáticamente.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-sans font-semibold text-[var(--ink-2)]">
                    Color Identificador
                  </label>
                  <div className="flex items-center gap-2">
                    {colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewAvatarColor(c)}
                        className={`w-7 h-7 rounded-[var(--r-pill)] transition-transform ${
                          newAvatarColor === c
                            ? "scale-110  ring-2 ring-[var(--ok)]"
                            : " opacity-75 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-[var(--r-m)] bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 mt-4 active:scale-[0.97]"
                >
                  {loading ? (
                    <span>Creando miembro…</span>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Crear e inscribir nuevo miembro</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Associate Existing User Form */
              <form onSubmit={handleAssociateUser} className="space-y-4">
                <div className="p-4 bg-[var(--tentative)]/5 rounded-[var(--r-l)] text-xs text-[var(--ink-2)]">
                  <p className="font-semibold text-[var(--tentative)] mb-1 flex items-center gap-1.5">
                    <span>¿Músico ya registrado en la plataforma?</span>
                  </p>
                  <span>
                    Aquí puedes agregar a tu banda un músico existente (como Wes
                    Borland) que ya tiene cuenta en otra banda sin tener que
                    recrear su usuario ni contraseña.
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-sans font-semibold text-[var(--ink-2)]">
                    Email del músico registrado *
                  </label>
                  <Input
                    size="sm"
                    type="email"
                    value={assocEmail}
                    onChange={(e) => setAssocEmail(e.target.value)}
                    placeholder="Introduce su email exacto…"
                    className="w-full"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-sans font-semibold text-[var(--ink-2)]">
                    Rol en esta Banda
                  </label>
                  <Select size="sm" aria-label="Rol en esta Banda"
                    value={assocRole}
                    onChange={(e) => setAssocRole(e.target.value as UserRole)}
                    wrapperClassName="w-full"
                  >
                    <option value="member">Miembro de banda (Músico)</option>
                    <option value="leader">Admin / dirección de banda</option>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-sans font-semibold text-[var(--ink-2)]">
                    Instrumento / Puesto (opcional)
                  </label>
                  <Input
                    size="sm"
                    type="text"
                    list="instrument-suggestions"
                    value={assocInstrument}
                    onChange={(e) => setAssocInstrument(e.target.value)}
                    placeholder="Ej: Guitarra, Bajista, Manager, Coros"
                    className="w-full"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !assocEmail.trim()}
                  className="w-full py-2.5 px-4 rounded-[var(--r-m)] bg-[var(--tentative)] hover:bg-[var(--tentative)] disabled:opacity-50 text-[var(--on-tentative)] font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 mt-4 active:scale-[0.97]"
                >
                  {loading ? (
                    <span>Asociando músico…</span>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Asociar músico a mi banda</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Modal Footer */}
          <div className={`px-6 py-3 text-right bg-[var(--bg)]`}>
            <Button
              variant="ghost"
              size="xs"
              onClick={onClose}
            >
              Cerrar panel
            </Button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
