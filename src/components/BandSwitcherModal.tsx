import React, { useState, useEffect } from 'react';
import { Guitar, Check, Plus, Sparkles, X, Shield, ArrowRight, Loader2, Camera, Upload, Trash2, Crown, Mail, ArrowUpRight, Star, Search, ArrowLeft, ArrowRight as ArrowRightIcon, GripVertical, Music, MapPin, Zap, User as UserIcon, ArrowUpDown, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { User } from '../types';
import { cleanBandId, isSameBandId } from '../utils/bandUtils';
import { uploadFileToServer } from '../utils/audioStorage';
import { api, getAuthHeaders } from '../services/api';
import { getPlanDefinition, getPlanChangeType, PLANS } from '../utils/planPermissions';
import { BandNameStylerHelper } from './common/BandNameStylerHelper';

interface BandSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  availableBands: Array<{ band_id: string; bandName: string; role?: string; logoUrl?: string; style?: string; plan?: string; is_main?: boolean }>;
  onSwitchBand: (bandId: string) => Promise<any>;
  onSetMainBand?: (bandId: string) => Promise<any>;
  onOpenRegisterBand?: () => void;
  epkConfig?: any;
  onUpdateEpkConfig?: (config: any) => Promise<any> | void;
  onRefreshData?: () => void;
}

export const BandSwitcherModal: React.FC<BandSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  availableBands,
  onSwitchBand,
  onSetMainBand,
  onOpenRegisterBand,
  epkConfig,
  onUpdateEpkConfig,
  onRefreshData,
}) => {
  const [switchingBandId, setSwitchingBandId] = useState<string | null>(null);
  const [settingMainBandId, setSettingMainBandId] = useState<string | null>(null);
  const [leavingBandId, setLeavingBandId] = useState<string | null>(null);
  const [uploadingBandId, setUploadingBandId] = useState<string | null>(null);
  const [customLogos, setCustomLogos] = useState<Record<string, string>>({});
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedBandForUpgrade, setSelectedBandForUpgrade] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedBandId, setDraggedBandId] = useState<string | null>(null);

  // Create new band state (2-step flow identical to Login registration)
  const [showCreateBandModal, setShowCreateBandModal] = useState(false);
  const [createBandStep, setCreateBandStep] = useState<1 | 2>(1);
  const [newBandName, setNewBandName] = useState('');
  const [newBandLeaderName, setNewBandLeaderName] = useState('');
  const [newBandStyle, setNewBandStyle] = useState('');
  const [newBandLocation, setNewBandLocation] = useState('España');
  const [newBandFeatureCategory, setNewBandFeatureCategory] = useState<'all' | 'booking' | 'media' | 'finance'>('all');
  const [isCreatingBand, setIsCreatingBand] = useState(false);
  const [creatingPlanKey, setCreatingPlanKey] = useState<string | null>(null);
  const [bandOrder, setBandOrder] = useState<string[]>(() => {
    if (currentUser?.band_order && Array.isArray(currentUser.band_order) && currentUser.band_order.length > 0) {
      return currentUser.band_order;
    }
    try {
      const saved = localStorage.getItem(`bandmanager_band_order_${currentUser?.id || 'default'}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [bandToDelete, setBandToDelete] = useState<{ id: string; name: string } | null>(null);

  const mainBandId = currentUser?.main_band_id || currentUser?.band_id || 'band-bakandeya';
  const [localMainBandId, setLocalMainBandId] = useState<string>(mainBandId);

  // Sync if currentUser updates
  useEffect(() => {
    if (currentUser?.band_order && Array.isArray(currentUser.band_order) && currentUser.band_order.length > 0) {
      setBandOrder(currentUser.band_order);
    }
  }, [currentUser?.band_order]);

  useEffect(() => {
    if (currentUser?.main_band_id) {
      setLocalMainBandId(currentUser.main_band_id);
    } else if (currentUser?.band_id) {
      setLocalMainBandId(currentUser.band_id);
    }
  }, [currentUser?.main_band_id, currentUser?.band_id]);

  const saveOrder = async (newOrder: string[]) => {
    setBandOrder(newOrder);
    try {
      localStorage.setItem(`bandmanager_band_order_${currentUser?.id || 'default'}`, JSON.stringify(newOrder));
    } catch (e) {
      console.warn('Could not save band order locally:', e);
    }
    try {
      await api.setBandOrder(newOrder);
    } catch (e) {
      console.warn('Could not sync band order to database:', e);
    }
  };

  if (!isOpen) return null;

  const currentActiveBandId = currentUser?.band_id || 'band-bakandeya';
  const activeClean = cleanBandId(currentActiveBandId);

  const handleRequestLeaveBand = (bandId: string, bandName: string) => {
    setBandToDelete({ id: bandId, name: bandName });
  };

  const handleConfirmLeaveBand = async () => {
    if (!bandToDelete) return;
    const { id: bandId, name: bandName } = bandToDelete;
    
    setLeavingBandId(bandId);
    setBandToDelete(null);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.leaveBand(bandId);
      if (res && res.success) {
        if (res.user) {
          localStorage.setItem('bakandeya_user', JSON.stringify(res.user));
          if (res.user.band_id && onSwitchBand) {
            await onSwitchBand(res.user.band_id);
          }
        }
        setSuccessMessage(`"${bandName}" eliminada de tu cuenta.`);
        if (onRefreshData) await onRefreshData();
        setTimeout(() => {
          window.location.reload(); 
        }, 400);
      } else {
        setErrorMessage(res?.message || "Error al eliminar la banda");
        setLeavingBandId(null);
      }
    } catch (err: any) {
      console.error("Error al eliminar banda", err);
      try {
        const response = await fetch(`/api/users/leave-band/${encodeURIComponent(bandId)}`, { 
          method: 'DELETE',
          headers: getAuthHeaders() as Record<string, string>
        });
        if (response.ok) {
          const resData = await response.json();
          if (resData?.user) {
            localStorage.setItem('bakandeya_user', JSON.stringify(resData.user));
            if (resData.user.band_id && onSwitchBand) {
              await onSwitchBand(resData.user.band_id);
            }
          }
          setSuccessMessage(`"${bandName}" eliminada de tu cuenta.`);
          if (onRefreshData) await onRefreshData();
          setTimeout(() => {
            window.location.reload();
          }, 400);
          return;
        }
      } catch {}
      setErrorMessage(err.message || "Error al eliminar la banda de tu usuario");
      setLeavingBandId(null);
    }
  };

  const openCreateBandModal = () => {
    setCreateBandStep(1);
    setNewBandName('');
    setNewBandLeaderName(currentUser?.name || currentUser?.username || '');
    setNewBandStyle('');
    setNewBandLocation('España');
    setNewBandFeatureCategory('all');
    setCreatingPlanKey(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowCreateBandModal(true);
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBandName.trim()) {
      setErrorMessage('Por favor, introduce el nombre del proyecto o banda');
      return;
    }
    setErrorMessage(null);
    setCreateBandStep(2);
  };

  const handleSelectPlanForCreation = async (planKey: string) => {
    if (isCreatingBand) return;
    if (!newBandName.trim()) {
      setErrorMessage('Por favor, introduce el nombre del proyecto');
      setCreateBandStep(1);
      return;
    }

    setIsCreatingBand(true);
    setCreatingPlanKey(planKey);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.createBand({
        bandName: newBandName.trim(),
        leaderName: newBandLeaderName.trim() || currentUser?.name || 'Líder',
        plan: planKey,
        estilo_musical: newBandStyle.trim() || undefined,
        localizacion: newBandLocation.trim() || undefined,
      });

      if (res && res.success) {
        if (res.user) {
          localStorage.setItem('bakandeya_user', JSON.stringify(res.user));
        }
        if (onSwitchBand && res.band_id) {
          await onSwitchBand(res.band_id);
        }

        // If paid plan, redirect to Stripe Checkout!
        if (planKey !== 'ensayo' && res.band_id) {
          try {
            await api.startCheckout({
              planId: planKey,
              billingInterval: 'monthly',
              bandId: res.band_id,
              userEmail: currentUser?.email || 'diego.delacalleb@gmail.com'
            });
            setShowCreateBandModal(false);
            setCreateBandStep(1);
            setIsCreatingBand(false);
            setCreatingPlanKey(null);
            return;
          } catch (stripeErr: any) {
            console.error('Error initiating Stripe checkout on band creation:', stripeErr);
          }
        }

        setSuccessMessage(`¡Proyecto "${newBandName.trim()}" creado y configurado correctamente!`);
        setShowCreateBandModal(false);
        setCreateBandStep(1);
        setNewBandName('');
        setNewBandStyle('');
        
        if (onRefreshData) await onRefreshData();
        setTimeout(() => {
          window.location.reload();
        }, 400);
      } else {
        setErrorMessage((res as any)?.error || 'Error al crear el proyecto');
        setIsCreatingBand(false);
        setCreatingPlanKey(null);
      }
    } catch (err: any) {
      console.error('Error creating band in modal:', err);
      setErrorMessage(err.message || 'Error al crear el proyecto musical');
      setIsCreatingBand(false);
      setCreatingPlanKey(null);
    }
  };

  const handleSetMainBandAction = async (e: React.MouseEvent, bandId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (settingMainBandId) return;
    setSettingMainBandId(bandId);
    setLocalMainBandId(bandId);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      if (onSetMainBand) {
        await onSetMainBand(bandId);
      } else {
        await api.setMainBand(bandId);
      }
      setSuccessMessage('¡Banda establecida como tu Proyecto Principal!');
      if (onRefreshData) await onRefreshData();
    } catch (err: any) {
      console.error('Error setting main band:', err);
      setErrorMessage(err.message || 'Error al establecer la banda principal');
    } finally {
      setSettingMainBandId(null);
    }
  };

  const handleUploadLogo = async (bandId: string, file: File) => {
    setUploadingBandId(bandId);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const uploadedUrl = await uploadFileToServer(file, { bandId, category: 'logo' });
      const clean = cleanBandId(bandId);

      // Persist to EPK endpoint
      const authHeaders = getAuthHeaders() as Record<string, string>;
      await fetch('/api/epk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          'x-band-id': bandId
        },
        body: JSON.stringify({
          bandId,
          logoUrl: uploadedUrl
        })
      });

      setCustomLogos(prev => ({ ...prev, [clean]: uploadedUrl }));

      if (isSameBandId(bandId, currentActiveBandId) && onUpdateEpkConfig) {
        await onUpdateEpkConfig({ ...epkConfig, logoUrl: uploadedUrl });
      }

      if (onRefreshData) {
        onRefreshData();
      }

      setSuccessMessage('¡Logo actualizado correctamente!');
    } catch (err: any) {
      console.error('Error uploading logo in BandSwitcherModal:', err);
      setErrorMessage('Error al subir el logo. Inténtalo de nuevo.');
    } finally {
      setUploadingBandId(null);
    }
  };

  // Ensure unique list of bands mapped by clean band ID
  const bandListMap = new Map<string, { band_id: string; bandName: string; role?: string; logoUrl?: string; plan?: string }>();
  
  if (availableBands && availableBands.length > 0) {
    availableBands.forEach((b) => {
      const bid = b.band_id;
      if (bid) {
        const clean = cleanBandId(bid);
        let logo = customLogos[clean] || b.logoUrl || (b as any).logo_url || (b as any).imagen_url || '';
        if (isSameBandId(bid, currentActiveBandId) && epkConfig?.logoUrl && !customLogos[clean]) {
          logo = epkConfig.logoUrl;
        }
        if (!logo && clean === 'bakandeya') {
          logo = '/logo_bakandeya_bueno_sin_fondo.png';
        }
        if (!bandListMap.has(clean)) {
          bandListMap.set(clean, {
            band_id: bid,
            bandName: b.bandName || 'Banda',
            role: b.role || 'member',
            logoUrl: logo,
            plan: b.plan || (isSameBandId(bid, currentActiveBandId) ? currentUser?.plan : 'emergente')
          });
        }
      }
    });
  }

  // Ensure active band is present
  if (!bandListMap.has(activeClean)) {
    let logo = customLogos[activeClean] || epkConfig?.logoUrl || '';
    if (!logo && activeClean === 'bakandeya') {
      logo = '/logo_bakandeya_bueno_sin_fondo.png';
    }
    bandListMap.set(activeClean, {
      band_id: currentActiveBandId,
      bandName: currentUser?.bandName || currentUser?.name || 'BAKANDEYA',
      role: currentUser?.role || 'leader',
      logoUrl: logo,
      plan: currentUser?.plan || 'ensayo'
    });
  }

  const rawBands = Array.from(bandListMap.values());
  const uniqueBands = [...rawBands].sort((a, b) => {
    const aIsMain = isSameBandId(a.band_id, mainBandId);
    const bIsMain = isSameBandId(b.band_id, mainBandId);
    if (aIsMain && !bIsMain) return -1;
    if (!aIsMain && bIsMain) return 1;

    const aIdx = bandOrder.indexOf(cleanBandId(a.band_id));
    const bIdx = bandOrder.indexOf(cleanBandId(b.band_id));
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.bandName.localeCompare(b.bandName);
  });

  const handleMoveBand = (bandId: string, direction: 'left' | 'right', e: React.MouseEvent) => {
    e.stopPropagation();
    const currentCleanIds = uniqueBands.map(b => cleanBandId(b.band_id));
    const cleanId = cleanBandId(bandId);
    const idx = currentCleanIds.indexOf(cleanId);
    if (idx === -1) return;

    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentCleanIds.length) return;

    const newOrder = [...currentCleanIds];
    const [moved] = newOrder.splice(idx, 1);
    newOrder.splice(targetIdx, 0, moved);
    saveOrder(newOrder);
  };

  const handleDragStart = (bandId: string, e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', bandId);
    setDraggedBandId(bandId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetBandId: string, e: React.DragEvent) => {
    e.preventDefault();
    const sourceBandId = e.dataTransfer.getData('text/plain') || draggedBandId;
    setDraggedBandId(null);
    if (!sourceBandId || sourceBandId === targetBandId) return;

    const currentCleanIds = uniqueBands.map(b => cleanBandId(b.band_id));
    const sourceClean = cleanBandId(sourceBandId);
    const targetClean = cleanBandId(targetBandId);

    const sourceIdx = currentCleanIds.indexOf(sourceClean);
    const targetIdx = currentCleanIds.indexOf(targetClean);
    if (sourceIdx === -1 || targetIdx === -1) return;

    const newOrder = [...currentCleanIds];
    const [moved] = newOrder.splice(sourceIdx, 1);
    newOrder.splice(targetIdx, 0, moved);
    saveOrder(newOrder);
  };

  const handleSelectBand = async (bandId: string) => {
    if (isSameBandId(bandId, currentActiveBandId)) {
      onClose();
      return;
    }

    setSwitchingBandId(bandId);
    setErrorMessage(null);

    try {
      await onSwitchBand(bandId);
      setSwitchingBandId(null);
      onClose();
    } catch (err: any) {
      console.error('Error switching band:', err);
      setErrorMessage(err.message || 'Error al cambiar de banda');
      setSwitchingBandId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative w-full max-w-4xl bg-[#121110] border border-[#2b2927] rounded-3xl shadow-2xl overflow-hidden flex flex-col p-6 md:p-10 text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={!!switchingBandId}
          className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-white bg-[#1a1918] hover:bg-[#282624] border border-[#2b2927] rounded-full transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="flex flex-col items-center mb-6 md:mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold tracking-wider uppercase mb-3 shadow-inner">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Perfil & Selección de Banda</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black font-display tracking-tight text-white uppercase">
            ¿Quién toca hoy?
          </h2>
          <p className="text-neutral-400 text-xs md:text-sm font-sans max-w-lg mt-2">
            Elige tu proyecto musical activo, marca tu <strong className="text-amber-400 font-semibold">Banda Principal</strong> o reordena tus proyectos arrastrándolos o con las flechas.
          </p>

          {/* Search bar if multiple bands */}
          {uniqueBands.length > 2 && (
            <div className="relative w-full max-w-xs mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar proyecto..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/60"
              />
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-xl font-medium">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl font-medium flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Band Cards Grid (Sleek Profile Switcher) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5 justify-center items-stretch max-h-[55vh] overflow-y-auto p-2 no-scrollbar">
          {uniqueBands
            .filter((band) => !searchQuery || band.bandName.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((band, index, array) => {
              const isActive = isSameBandId(band.band_id, currentActiveBandId);
              const isMain = isSameBandId(band.band_id, localMainBandId || mainBandId);
              const isSwitching = switchingBandId === band.band_id;
              const isSettingMain = settingMainBandId === band.band_id;
              const isLeavingThis = leavingBandId === band.band_id;
              const isDragged = draggedBandId === band.band_id;
              const planDef = getPlanDefinition(band.plan);

              return (
                <div
                  key={`netflix-band-${band.band_id}`}
                  draggable={!switchingBandId && !isLeavingThis}
                  onDragStart={(e) => handleDragStart(band.band_id, e)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(band.band_id, e)}
                  onClick={() => !switchingBandId && !isSettingMain && !isLeavingThis && handleSelectBand(band.band_id)}
                  className={`group relative flex flex-col items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all duration-300 cursor-pointer select-none ${
                    isDragged ? 'opacity-30 scale-95 border-dashed border-amber-500' : ''
                  } ${
                    isActive
                      ? 'bg-gradient-to-b from-amber-500/20 via-[#181716] to-[#121110] border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.2)] ring-1 ring-amber-500/40'
                      : 'bg-[#181716] border-[#2b2927] hover:border-amber-500/70 hover:bg-[#1e1d1b] hover:shadow-lg'
                  } ${switchingBandId && !isSwitching ? 'opacity-40 grayscale pointer-events-none' : ''}`}
                >
                  {/* Top Bar on Card: Star (Principal) + Reorder arrows on left, Delete Trash on top-right */}
                  <div className="w-full flex items-center justify-between z-20 mb-1">
                    {/* Left: Star (Principal) + Reorder arrows */}
                    <div className="flex items-center gap-1">
                      {/* Star Button (Principal) */}
                      <button
                        type="button"
                        onClick={(e) => handleSetMainBandAction(e, band.band_id)}
                        disabled={isMain || !!settingMainBandId}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center z-30 ${
                          isMain
                            ? 'text-amber-400 bg-amber-400/20 border border-amber-400/50 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                            : 'text-neutral-400 hover:text-amber-300 bg-black/60 hover:bg-neutral-800 border border-neutral-700/80 hover:border-amber-500/60'
                        }`}
                        title={isMain ? 'Banda Principal por defecto' : 'Fijar como Banda Principal'}
                      >
                        <Star className={`w-3.5 h-3.5 ${isMain ? 'fill-amber-400 text-amber-400' : 'text-neutral-400'}`} />
                      </button>

                      {/* Quick Reorder (left/right) */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {array.length > 1 && (
                          <>
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={(e) => handleMoveBand(band.band_id, 'left', e)}
                              className="p-1 rounded-md bg-black/60 hover:bg-neutral-800 text-neutral-400 hover:text-amber-300 disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer"
                              title="Mover a la izquierda"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={index === array.length - 1}
                              onClick={(e) => handleMoveBand(band.band_id, 'right', e)}
                              className="p-1 rounded-md bg-black/60 hover:bg-neutral-800 text-neutral-400 hover:text-amber-300 disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer"
                              title="Mover a la derecha"
                            >
                              <ArrowRightIcon className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Top Right: Delete Button (Trash) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleRequestLeaveBand(band.band_id, band.bandName);
                      }}
                      disabled={!!leavingBandId}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 bg-black/60 hover:bg-rose-950/40 border border-neutral-700/80 hover:border-rose-500/50 transition-all cursor-pointer z-30"
                      title="Eliminar esta banda de mi usuario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Central Logo Avatar (Display only - no file picker) */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-neutral-950 border border-[#333130] group-hover:border-amber-400/60 transition-all flex items-center justify-center p-2 shadow-inner my-2 shrink-0">
                    {band.logoUrl && !failedLogos.has(band.band_id) ? (
                      <img
                        src={band.logoUrl}
                        alt={band.bandName}
                        onError={() => setFailedLogos(prev => new Set(prev).add(band.band_id))}
                        className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-600/15 flex flex-col items-center justify-center text-amber-400 gap-1">
                        <Guitar className="w-8 h-8 opacity-80" />
                        <span className="text-xs font-black font-mono text-zinc-300">
                          {band.bandName.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Loading Spinner Overlay */}
                    {(isSwitching || isSettingMain || isLeavingThis) && (
                      <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center text-amber-400 gap-1 z-30">
                        <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                        <span className="text-[9px] font-mono text-amber-300 uppercase font-bold">
                          {isSettingMain ? 'Guardando' : isLeavingThis ? 'Eliminando' : 'Cambiando'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Band Title */}
                  <div className="w-full text-center mt-1">
                    <h3 className="text-sm font-bold font-display tracking-wide uppercase text-white group-hover:text-amber-300 transition-colors truncate px-1" title={band.bandName}>
                      {band.bandName}
                    </h3>
                  </div>

                  {/* Plan Badge (Clickable to Upgrade/Downgrade) */}
                  <div className="mt-1 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setSelectedBandForUpgrade(band);
                        setShowUpgradeModal(true);
                      }}
                      className="inline-flex items-center gap-1 text-[9px] font-mono font-semibold px-2 py-0.5 rounded-md border hover:scale-105 transition-all cursor-pointer shadow-xs group/plan"
                      style={{
                        backgroundColor: `${planDef.color}18`,
                        color: planDef.color,
                        borderColor: `${planDef.color}40`,
                      }}
                      title={`Plan actual: ${planDef.name}. Clic para Cambiar Plan (Upgrade / Downgrade)`}
                    >
                      <Crown className="w-2.5 h-2.5" />
                      <span>{planDef.name}</span>
                      <ArrowUpDown className="w-2.5 h-2.5 opacity-60 group-hover/plan:opacity-100" />
                    </button>
                  </div>

                  {/* Active Status Badge (Only when active) */}
                  <div className="mt-1.5 flex items-center justify-center h-5">
                    {isActive && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                        <span>Activa</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

          {/* Option Card: Add/Register Band */}
          <div
            onClick={openCreateBandModal}
            className="group flex flex-col items-center justify-center p-5 rounded-2xl border border-dashed border-[#333130] bg-[#141312] hover:border-amber-500/70 hover:bg-[#191817] transition-all duration-300 cursor-pointer text-neutral-400 hover:text-amber-300 min-h-[170px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#1e1d1b] border border-[#333130] group-hover:border-amber-500/50 flex items-center justify-center text-neutral-300 group-hover:text-amber-400 transition-all mb-2 shadow-inner">
              <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xs font-bold font-display uppercase tracking-wider text-center">
              Añadir Proyecto
            </span>
            <span className="text-[10px] font-mono text-neutral-500 mt-0.5 text-center">
              Registrar otra banda
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-8 pt-4 border-t border-[#2b2927]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <span className="font-mono">
            {uniqueBands.length} {uniqueBands.length === 1 ? 'proyecto disponible' : 'proyectos disponibles'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#1a1918] hover:bg-[#282624] text-neutral-300 hover:text-white border border-[#2b2927] transition-all cursor-pointer font-medium"
          >
            Mantener banda actual
          </button>
        </div>
      </div>

      {/* In-App Create / Add Band Modal with Full 2-Step Flow & Plans */}
      {showCreateBandModal && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto">
          <div className={`w-full ${createBandStep === 1 ? 'max-w-lg' : 'max-w-5xl'} rounded-3xl border border-amber-500/30 bg-[#11100f] text-neutral-100 p-6 sm:p-8 shadow-2xl space-y-6 transition-all duration-300 my-auto`}>
            
            {/* Step 1: Band Details */}
            {createBandStep === 1 && (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-[#2b2927] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                      <Guitar className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white font-display tracking-wide">Añadir Nuevo Proyecto Musical</h3>
                      <p className="text-xs text-amber-400/80 font-mono">Paso 1 de 2 • Información del proyecto</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateBandModal(false)}
                    className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleStep1Submit} className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono font-semibold text-neutral-300 flex items-center gap-1.5">
                        <Guitar className="w-3.5 h-3.5 text-amber-400" />
                        <span>Nombre del Proyecto / Banda *</span>
                      </label>
                      <BandNameStylerHelper
                        value={newBandName}
                        onChange={(styled) => setNewBandName(styled)}
                      />
                    </div>
                    <input
                      type="text"
                      value={newBandName}
                      onChange={(e) => setNewBandName(e.target.value)}
                      placeholder="Ej: Los Nocturnos, KoЯn, 𝕭𝖑𝖆𝖈𝖐 𝕸𝖊𝖙𝖆𝖑, Bakandeya..."
                      required
                      autoFocus
                      className="w-full px-4 py-3 rounded-2xl text-sm bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:border-amber-500/70 focus:outline-none transition-colors shadow-inner font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-semibold text-neutral-400 flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-amber-400" />
                      <span>Tu Rol o Nombre en este Proyecto</span>
                    </label>
                    <input
                      type="text"
                      value={newBandLeaderName}
                      onChange={(e) => setNewBandLeaderName(e.target.value)}
                      placeholder="Ej: Diego (Guitarra & Mánager)"
                      className="w-full px-4 py-2.5 rounded-2xl text-xs bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:border-amber-500/70 focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono font-semibold text-neutral-400 flex items-center gap-1.5">
                        <Music className="w-3.5 h-3.5 text-amber-400" />
                        <span>Estilo Musical / Género</span>
                      </label>
                      <input
                        type="text"
                        value={newBandStyle}
                        onChange={(e) => setNewBandStyle(e.target.value)}
                        placeholder="Ej: Rock, Indie, Mestizaje, Ska..."
                        className="w-full px-4 py-2.5 rounded-2xl text-xs bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:border-amber-500/70 focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-mono font-semibold text-neutral-400 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        <span>Ciudad / Ubicación Base</span>
                      </label>
                      <input
                        type="text"
                        value={newBandLocation}
                        onChange={(e) => setNewBandLocation(e.target.value)}
                        placeholder="Ej: Madrid, Barcelona, Valencia..."
                        className="w-full px-4 py-2.5 rounded-2xl text-xs bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:border-amber-500/70 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2b2927]">
                    <button
                      type="button"
                      onClick={() => setShowCreateBandModal(false)}
                      className="px-4 py-2.5 rounded-xl bg-[#1e1d1b] hover:bg-[#282624] text-neutral-300 text-xs font-medium border border-[#333130] transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!newBandName.trim()}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Continuar a Elegir Plan</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 2: Plans Selection View (Identical to Login Registration Flow) */}
            {createBandStep === 2 && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCreateBandStep(1)}
                    disabled={isCreatingBand}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1c1b19] hover:bg-[#262422] text-xs font-mono text-neutral-300 hover:text-white border border-[#333130] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Volver a datos de la banda</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateBandModal(false)}
                    disabled={isCreatingBand}
                    className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="text-center space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-bold text-neutral-100 tracking-tight">
                    Elige el plan para <span className="text-[#f2ca50]">{newBandName.trim() || 'tu Proyecto'}</span>
                  </h2>
                  <p className="text-neutral-400 max-w-xl mx-auto text-xs sm:text-sm">
                    Sube de nivel tu carrera musical. Puedes cambiar de plan en cualquier momento.
                  </p>

                  {/* Filter category pills */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setNewBandFeatureCategory('all')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        newBandFeatureCategory === 'all'
                          ? 'bg-[#f2ca50] text-neutral-950 shadow-md shadow-[#f2ca50]/20'
                          : 'bg-[#181716] text-neutral-400 hover:text-white border border-neutral-800'
                      }`}
                    >
                      Todas las funciones
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewBandFeatureCategory('booking')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        newBandFeatureCategory === 'booking'
                          ? 'bg-[#f2ca50] text-neutral-950 shadow-md shadow-[#f2ca50]/20'
                          : 'bg-[#181716] text-neutral-400 hover:text-white border border-neutral-800'
                      }`}
                    >
                      🎯 Booking & Salas
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewBandFeatureCategory('media')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        newBandFeatureCategory === 'media'
                          ? 'bg-[#f2ca50] text-neutral-950 shadow-md shadow-[#f2ca50]/20'
                          : 'bg-[#181716] text-neutral-400 hover:text-white border border-neutral-800'
                      }`}
                    >
                      📱 Redes, EPK & Fans
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewBandFeatureCategory('finance')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        newBandFeatureCategory === 'finance'
                          ? 'bg-[#f2ca50] text-neutral-950 shadow-md shadow-[#f2ca50]/20'
                          : 'bg-[#181716] text-neutral-400 hover:text-white border border-neutral-800'
                      }`}
                    >
                      💼 Finanzas & Agentes 360
                    </button>
                  </div>
                </div>

                {/* 4 Pricing & Plan Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch pt-2">
                  
                  {/* PLAN 1: ENSAYO */}
                  <div className="bg-[#151413] border border-neutral-800/80 rounded-3xl p-5 flex flex-col hover:border-neutral-700 transition-colors">
                    <div className="mb-3">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">Gratis</span>
                      </div>
                      <h3 className="text-base font-bold text-neutral-200">Ensayo</h3>
                      <div className="mt-1.5 flex items-baseline gap-1">
                        <span className="text-2xl font-black text-white">0€</span>
                        <span className="text-[11px] text-neutral-500 font-medium">/ siempre</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1.5 min-h-[32px]">Para proyectos noveles que arrancan su local.</p>
                    </div>

                    <ul className="space-y-2 mb-5 flex-1 text-xs">
                      {[
                        { text: '10 salas en CRM', cat: 'booking' },
                        { text: 'Calendario y bolos', cat: 'booking' },
                        { text: 'EPK Dossier básico', cat: 'media' },
                        { text: 'Repertorio y afinador', cat: 'media' }
                      ].map((f, i) => {
                        const isHighlighted = newBandFeatureCategory === 'all' || newBandFeatureCategory === f.cat;
                        return (
                          <li key={i} className={`flex items-start gap-2 transition-opacity duration-200 ${isHighlighted ? 'text-neutral-300 opacity-100' : 'text-neutral-600 opacity-40'}`}>
                            <Check className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isHighlighted ? 'text-neutral-400' : 'text-neutral-700'}`} />
                            <span className={isHighlighted && newBandFeatureCategory !== 'all' ? 'font-bold text-[#f2ca50]' : ''}>{f.text}</span>
                          </li>
                        );
                      })}
                    </ul>

                    <button
                      type="button"
                      onClick={() => handleSelectPlanForCreation('ensayo')}
                      disabled={isCreatingBand}
                      className="w-full py-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isCreatingBand && creatingPlanKey === 'ensayo' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Configurando...</span>
                        </>
                      ) : (
                        <span>Empezar Gratis</span>
                      )}
                    </button>
                  </div>

                  {/* PLAN 2: LOCAL */}
                  <div className="bg-[#151413] border border-slate-700/60 rounded-3xl p-5 flex flex-col hover:border-slate-500 transition-colors relative">
                    <div className="mb-3">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">Iniciación</span>
                      </div>
                      <h3 className="text-base font-bold text-slate-200">Local</h3>
                      <div className="mt-1.5 flex items-baseline gap-1">
                        <span className="text-2xl font-black text-white">12€</span>
                        <span className="text-[11px] text-neutral-400">/ mes</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1.5 min-h-[32px]">El kit esencial para bandas tocando en su circuito local.</p>
                    </div>

                    <div className="mb-3 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-600/50 flex items-center gap-1.5 text-[10px] font-mono text-slate-200 font-bold">
                      <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>🎁 250 pegatinas gratis</span>
                    </div>

                    <ul className="space-y-2 mb-5 flex-1 text-xs">
                      {[
                        { text: '50 salas de conciertos', cat: 'booking' },
                        { text: '20 medios y radios', cat: 'booking' },
                        { text: '100 fans con QR', cat: 'media' },
                        { text: 'Reels & Social Center', cat: 'media' }
                      ].map((f, i) => {
                        const isHighlighted = newBandFeatureCategory === 'all' || newBandFeatureCategory === f.cat;
                        return (
                          <li key={i} className={`flex items-start gap-2 transition-opacity duration-200 ${isHighlighted ? 'text-neutral-200 opacity-100' : 'text-neutral-600 opacity-40'}`}>
                            <Check className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isHighlighted ? 'text-slate-300' : 'text-neutral-700'}`} />
                            <span className={isHighlighted && newBandFeatureCategory !== 'all' ? 'font-bold text-[#f2ca50]' : ''}>{f.text}</span>
                          </li>
                        );
                      })}
                    </ul>

                    <button
                      type="button"
                      onClick={() => handleSelectPlanForCreation('local')}
                      disabled={isCreatingBand}
                      className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isCreatingBand && creatingPlanKey === 'local' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Configurando...</span>
                        </>
                      ) : (
                        <span>Elegir Local</span>
                      )}
                    </button>
                  </div>

                  {/* PLAN 3: DE GIRA (Destacado) */}
                  <div className="bg-[#1b1916] border-2 border-[#f2ca50] rounded-3xl p-5 flex flex-col relative shadow-[0_0_35px_rgba(242,202,80,0.18)]">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#f2ca50] text-neutral-950 text-[9px] font-bold uppercase tracking-wider py-0.5 px-2.5 rounded-full flex items-center gap-1 shadow-md whitespace-nowrap">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      Más Popular
                    </div>

                    <div className="mb-3 mt-1">
                      <h3 className="text-base font-bold text-[#f2ca50]">De Gira</h3>
                      <div className="mt-1.5 flex items-baseline gap-1">
                        <span className="text-2xl font-black text-white">29€</span>
                        <span className="text-[11px] text-neutral-400">/ mes</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1.5 min-h-[32px]">Para bandas que tocan con frecuencia y automatizan con IA.</p>
                    </div>

                    <div className="mb-3 px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center gap-1.5 text-[10px] font-mono text-amber-300 font-bold">
                      <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>🎁 500 pegatinas gratis</span>
                    </div>

                    <ul className="space-y-2 mb-5 flex-1 text-xs">
                      {[
                        { text: 'Salas & medios ilimitados', cat: 'booking' },
                        { text: 'Agente Booking IA en batch', cat: 'booking' },
                        { text: 'Rutas de Gira & Dietas', cat: 'booking' },
                        { text: 'Fans & Reels ilimitados', cat: 'media' }
                      ].map((f, i) => {
                        const isHighlighted = newBandFeatureCategory === 'all' || newBandFeatureCategory === f.cat;
                        return (
                          <li key={i} className={`flex items-start gap-2 transition-opacity duration-200 ${isHighlighted ? 'text-neutral-200 opacity-100' : 'text-neutral-600 opacity-40'}`}>
                            <Zap className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isHighlighted ? 'text-[#f2ca50]' : 'text-neutral-700'}`} />
                            <span className={isHighlighted && newBandFeatureCategory !== 'all' ? 'font-bold text-[#f2ca50]' : ''}>{f.text}</span>
                          </li>
                        );
                      })}
                    </ul>

                    <button
                      type="button"
                      onClick={() => handleSelectPlanForCreation('de_gira')}
                      disabled={isCreatingBand}
                      className="w-full py-2.5 rounded-2xl bg-[#f2ca50] hover:bg-[#f5d778] text-neutral-950 font-bold text-xs transition-colors cursor-pointer shadow-md shadow-[#f2ca50]/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isCreatingBand && creatingPlanKey === 'de_gira' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                          <span>Configurando...</span>
                        </>
                      ) : (
                        <>
                          <span>Elegir De Gira</span>
                          <ArrowRight className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* PLAN 4: CABEZA DE CARTEL */}
                  <div className="bg-[#151413] border border-emerald-800/80 rounded-3xl p-5 flex flex-col hover:border-emerald-600 transition-colors">
                    <div className="mb-3">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-600/40">Élite 360</span>
                      </div>
                      <h3 className="text-base font-bold text-emerald-300">Cabeza de Cartel</h3>
                      <div className="mt-1.5 flex items-baseline gap-1">
                        <span className="text-2xl font-black text-white">79€</span>
                        <span className="text-[11px] text-neutral-400">/ mes</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1.5 min-h-[32px]">Control total para proyectos profesionales y agencias.</p>
                    </div>

                    <div className="mb-3 px-2.5 py-1 rounded-xl bg-emerald-950/50 border border-emerald-600/40 flex items-center gap-1.5 text-[10px] font-mono text-emerald-300 font-bold">
                      <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>🎁 1.000 pegatinas + Express</span>
                    </div>

                    <ul className="space-y-2 mb-5 flex-1 text-xs">
                      {[
                        { text: 'Hasta 5 bandas multi-proyecto', cat: 'all' },
                        { text: 'Finanzas & Balances Pro', cat: 'finance' },
                        { text: 'Taller Merchan & Inventario', cat: 'finance' },
                        { text: 'IA Multi-Agente & Soporte VIP', cat: 'finance' }
                      ].map((f, i) => {
                        const isHighlighted = newBandFeatureCategory === 'all' || newBandFeatureCategory === f.cat;
                        return (
                          <li key={i} className={`flex items-start gap-2 transition-opacity duration-200 ${isHighlighted ? 'text-neutral-300 opacity-100' : 'text-neutral-600 opacity-40'}`}>
                            <Shield className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isHighlighted ? 'text-emerald-400' : 'text-neutral-700'}`} />
                            <span className={isHighlighted && newBandFeatureCategory !== 'all' ? 'font-bold text-[#f2ca50]' : ''}>{f.text}</span>
                          </li>
                        );
                      })}
                    </ul>

                    <button
                      type="button"
                      onClick={() => handleSelectPlanForCreation('cabeza_de_cartel')}
                      disabled={isCreatingBand}
                      className="w-full py-2.5 rounded-2xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 font-semibold text-xs border border-emerald-600/40 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isCreatingBand && creatingPlanKey === 'cabeza_de_cartel' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Configurando...</span>
                        </>
                      ) : (
                        <span>Seleccionar 360</span>
                      )}
                    </button>
                  </div>

                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* In-App Delete Band Confirmation Modal */}
      {bandToDelete && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-rose-500/30 bg-[#161514] text-neutral-100 p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white font-mono">¿Eliminar proyecto?</h3>
                <p className="text-xs text-neutral-400">Desvincular de tu usuario</p>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              ¿Estás seguro de que deseas eliminar <strong className="text-white">"{bandToDelete.name}"</strong> de tu cuenta? Perderás el acceso a sus salas, eventos y repertorio.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2b2927]">
              <button
                type="button"
                onClick={() => setBandToDelete(null)}
                className="px-3.5 py-1.5 rounded-xl bg-[#222120] hover:bg-[#2c2a28] text-neutral-300 text-xs font-medium border border-[#333130] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmLeaveBand}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Plan Modal */}
      {showUpgradeModal && (() => {
        const targetBand = selectedBandForUpgrade || availableBands.find(b => isSameBandId(b.band_id, currentUser?.band_id)) || { band_id: currentUser?.band_id, bandName: currentUser?.bandName, plan: currentUser?.plan };
        const targetBandName = targetBand.bandName || targetBand.nombre_banda || currentUser?.bandName || 'tu banda';
        const targetBandPlan = targetBand.plan || (isSameBandId(targetBand.band_id, currentUser?.band_id) ? currentUser?.plan : 'ensayo');
        const currentPlanDef = getPlanDefinition(targetBandPlan);

        return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 text-left">
          <div className="w-full max-w-lg rounded-2xl shadow-2xl border bg-neutral-900 border-amber-500/30 text-neutral-100 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-gradient-to-r from-amber-950/60 via-neutral-900 to-neutral-950 border-b border-amber-500/20 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-amber-300 font-mono uppercase tracking-wider">Planes & Upgrade — {targetBandName}</h3>
                  <p className="text-[10px] text-neutral-400 font-mono">Plan independiente para {targetBandName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-3">
                {Object.values(PLANS).map((plan) => {
                  const isCurrent = currentPlanDef.id === plan.id;
                  return (
                    <div
                      key={plan.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/30'
                          : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white font-mono">{plan.name}</span>
                          {isCurrent && (
                            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              Plan Actual
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold font-mono text-amber-400">{plan.price}</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1">{plan.description}</p>
                      <ul className="mt-2.5 space-y-1 font-sans">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="text-[10.5px] text-neutral-300 flex items-center gap-1.5">
                            <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-neutral-800/80">
                        <span className="text-[10px] font-mono text-neutral-400">
                          {isCurrent ? 'Plan activo para esta banda' : 'Cambio de plan inmediato'}
                        </span>
                        {isCurrent ? (
                          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                            <Check className="w-3 h-3 text-amber-400" />
                            <span>Activo</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={async () => {
                              const isLeaderOrAdmin = targetBand?.role === 'leader' || targetBand?.role === 'admin' || currentUser?.role === 'leader' || currentUser?.role === 'admin';
                              if (!isLeaderOrAdmin) {
                                alert('Sólo los administradores o líderes de esta banda pueden cambiar o mejorar su plan de suscripción.');
                                return;
                              }
                              try {
                                const targetBandId = targetBand.band_id || currentUser?.band_id;

                                // If it's a paid plan, initiate Stripe Checkout session!
                                if (plan.id !== 'ensayo') {
                                  await api.startCheckout({
                                    planId: plan.id,
                                    billingInterval: 'monthly',
                                    bandId: targetBandId,
                                    userEmail: currentUser?.email || 'diego.delacalleb@gmail.com'
                                  });
                                  setShowUpgradeModal(false);
                                  return;
                                }

                                // Free plan (ensayo)
                                if (currentUser?.id) {
                                  await api.updateUser(currentUser.id, { plan: plan.id, band_id: targetBandId } as any);
                                }
                                if (isSameBandId(targetBandId, currentUser?.band_id) && currentUser) {
                                  const updatedUser = { ...currentUser, plan: plan.id };
                                  localStorage.setItem('bakandeya_user', JSON.stringify(updatedUser));
                                }
                                setShowUpgradeModal(false);
                                setSuccessMessage(`¡Plan de ${targetBandName} cambiado a ${plan.name}!`);
                                if (onRefreshData) await onRefreshData();
                              } catch (e: any) {
                                console.error('Error al cambiar plan:', e);
                                alert(e?.message || 'No se pudo actualizar el plan. Reintenta en unos instantes.');
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold font-mono text-xs transition-all shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95 flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 fill-stone-950" />
                            <span>Seleccionar {plan.name}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-3 bg-neutral-950 border-t border-neutral-800 flex justify-end">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-mono bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
};
