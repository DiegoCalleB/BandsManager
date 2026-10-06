import { useState, useEffect, useCallback } from 'react';
import {
  Lead,
  Rehearsal,
  Concert,
  SocialPost,
  Payment,
  Message,
  SocialMetric,
  User,
  Fan,
  Tour,
  EPKConfig,
  BookingCampaign,
} from '../types';
import { api, ApiError } from '../services/api';

const DEFAULT_CAMPAIGNS: BookingCampaign[] = [
  {
    id: 'camp-dic-2026',
    name: 'Campaña Diciembre 2026 (Madrid & Centro)',
    targetCities: ['Madrid', 'Toledo', 'Guadalajara'],
    minCapacity: 300,
    maxCapacity: 500,
    targetDates: ['2026-12-04', '2026-12-05', '2026-12-11', '2026-12-12'],
    targetDatesText: '4 y 5 de diciembre, 11 y 12 de diciembre',
    notes: 'Presentación del nuevo single y co-booking en salas de aforo medio.',
    isActive: true,
    color: 'var(--acc)',
  },
  {
    id: 'camp-primavera-2027',
    name: 'Gira Primavera 2027 (Levante & Norte)',
    targetCities: ['Barcelona', 'Valencia', 'Bilbao', 'Zaragoza'],
    minCapacity: 200,
    maxCapacity: 450,
    targetDates: ['2027-04-09', '2027-04-10', '2027-04-23', '2027-04-24'],
    targetDatesText: '9 y 10 de abril, 23 y 24 de abril',
    notes: 'Gira de salas con intercambio de público con bandas aliadas de la zona.',
    isActive: false,
    color: 'var(--acc)',
  },
];

export function useAppData(isLoggedIn: boolean, bandId?: string) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [rehearsals, setRehearsals] = useState<Rehearsal[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [metrics, setMetrics] = useState<SocialMetric[]>([]);
  const [bandUsers, setBandUsers] = useState<User[]>([]);
  const [fans, setFans] = useState<Fan[]>([]);
  const [epkConfig, setEpkConfig] = useState<Partial<EPKConfig>>({});
  const [campaigns, setCampaigns] = useState<BookingCampaign[]>(() => {
    try {
      const cached = localStorage.getItem('bandmanager_campaigns');
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return DEFAULT_CAMPAIGNS;
  });
  const [activeCampaign, setActiveCampaign] = useState<BookingCampaign | null>(() => {
    try {
      const cached = localStorage.getItem('bandmanager_active_campaign');
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return DEFAULT_CAMPAIGNS.find((c) => c.isActive) || DEFAULT_CAMPAIGNS[0];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('syncing');

  const dedupeById = <T extends { id?: string }>(arr: T[] = []): T[] => {
    const seen = new Set<string>();
    return arr.filter((item) => {
      if (!item) return false;
      const idStr = item.id ? String(item.id).trim() : null;
      if (!idStr) return true;
      if (seen.has(idStr)) return false;
      seen.add(idStr);
      return true;
    });
  };

  const parseSafeList = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.map((x) => (typeof x === 'string' ? x : x?.name || x?.nombre || String(x))).filter(Boolean);
    if (typeof val === 'string' && val.trim()) {
      const trimmed = val.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed))
            return parsed.map((x) => (typeof x === 'string' ? x : x?.name || x?.nombre || String(x))).filter(Boolean);
        } catch {}
      }
      return trimmed
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  };

  const normalizeRehearsal = (r: any): Rehearsal => {
    if (!r) return r;
    return {
      ...r,
      asistentes: parseSafeList(r.asistentes),
      convocados_nombres: r.convocados_nombres ? parseSafeList(r.convocados_nombres) : undefined,
      convocados_ids: r.convocados_ids ? parseSafeList(r.convocados_ids) : undefined,
    };
  };

  const normalizeConcert = (c: any): Concert => {
    if (!c) return c;
    return {
      ...c,
      convocados_nombres: c.convocados_nombres ? parseSafeList(c.convocados_nombres) : undefined,
      convocados_ids: c.convocados_ids ? parseSafeList(c.convocados_ids) : undefined,
    };
  };

  const fetchState = useCallback(async (retryCount = 0) => {
    setSyncStatus('syncing');
    try {
      const data = await api.getState();
      setLeads(dedupeById(data.leads || []));
      setRehearsals(dedupeById((data.rehearsals || []).map(normalizeRehearsal)));
      setTours(dedupeById(data.tours || []));
      setConcerts(dedupeById((data.concerts || []).map(normalizeConcert)));
      setPosts(dedupeById(data.posts || []));
      setPayments(dedupeById(data.payments || []));
      setMessages(dedupeById(data.messages || []));
      setMetrics(dedupeById(data.metrics || []));
      setBandUsers(dedupeById(data.users || []));
      setFans(dedupeById(data.fans || []));
      setEpkConfig(data.epkConfig || {});
      // Antes solo se sincronizaba cuando el array venía con datos, así que una banda sin ninguna
      // campaña propia (p. ej. recién creada) se quedaba mostrando la campaña de la banda anterior
      // (o la de la caché de localStorage, compartida entre bandas): "cero campañas" nunca se
      // distinguía de "todavía no ha llegado la respuesta". Ahora se sincroniza siempre con lo que
      // devuelva el servidor, incluida la lista vacía.
      if (Array.isArray((data as any).campaigns)) {
        const fetchedCampaigns = (data as any).campaigns as BookingCampaign[];
        setCampaigns(fetchedCampaigns);
        localStorage.setItem('bandmanager_campaigns', JSON.stringify(fetchedCampaigns));
        const active = fetchedCampaigns.find((c: BookingCampaign) => c.isActive) || null;
        setActiveCampaign(active);
        if (active) {
          localStorage.setItem('bandmanager_active_campaign', JSON.stringify(active));
        } else {
          localStorage.removeItem('bandmanager_active_campaign');
        }
      }
      setSyncStatus('synced');
    } catch (e) {
      console.warn(`Connecting to server (attempt ${retryCount + 1}):`, e);
      if (retryCount < 2) {
        setTimeout(() => {
          fetchState(retryCount + 1);
        }, 1500);
      } else {
        // Antes se marcaba como'synced' tras agotar los reintentos, así que el usuario veía el
        // indicador de "sincronizado" mientras en realidad no había datos reales cargados (solo
        // los arrays vacíos del useState inicial, no hay caché real que reutilizar). Mejor
        // mostrar el estado de error real.
        console.warn('No se pudo conectar con el servidor tras varios intentos.');
        setSyncStatus('error');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      // Evita que el EPK (y la campaña activa, mismo problema) de la banda anterior queden
      // visibles mientras se cargan los datos de la nueva banda tras un cambio de banda activa.
      setEpkConfig({});
      setActiveCampaign(null);
      fetchState();
    }
  }, [isLoggedIn, bandId, fetchState]);

  // Handle external agent completions and app data updates
  useEffect(() => {
    const handleRefresh = () => {
      console.log('[useAppData] Refrescando datos del servidor...');
      fetchState();
    };
    window.addEventListener('github-agent-completed', handleRefresh);
    window.addEventListener('app-data-updated', handleRefresh);
    return () => {
      window.removeEventListener('github-agent-completed', handleRefresh);
      window.removeEventListener('app-data-updated', handleRefresh);
    };
  }, [fetchState]);

  // REST API UPDATE OPERATIONS
  const handleUpdateEpkConfig = async (newConfig: any) => {
    setEpkConfig((prev) => ({ ...prev, ...newConfig }));
    const resolvedBandId = newConfig?.bandId || bandId;
    if (!resolvedBandId) {
      console.error('Error updating EPK config: no hay banda activa.');
      alert('No se pudo guardar: no hay ninguna banda activa seleccionada.');
      return;
    }
    try {
      const payload = {
        ...newConfig,
        bandId: resolvedBandId,
      };
      await api.updateEpkConfig(payload);
    } catch (e: any) {
      // Antes este error se quedaba solo en consola: el cambio se pintaba igual (estado
      // optimista de arriba) aunque el guardado real hubiera fallado, así que parecía
      // persistir hasta el siguiente refresco/redeploy, cuando volvía a como estaba. Al
      // fallar, se avisa Y se recarga el estado real del servidor para no dejar la UI
      // enseñando un cambio que nunca llegó a guardarse.
      console.error('Error updating EPK config:', e);
      alert(
        `No se pudo guardar el cambio en el EPK (logo, biografía, etc.): ${e?.message || 'error desconocido'}. Se ha revertido a lo último guardado.`
      );
      fetchState();
    }
  };

  // Devuelve true si se guardó y false si no: quien encadena pasos (aprobar y lanzar el Enviador)
  // necesita saberlo, porque antes el error se tragaba y el siguiente paso corría igualmente.
  const handleUpdateLead = async (id: string, updatedFields: Partial<Lead>, expectedStatus?: string): Promise<boolean> => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...updatedFields } : l)));
    try {
      await api.updateLead(id, updatedFields, expectedStatus);
      return true;
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 409) {
        alert(e.message);
      } else {
        console.error('Error saving lead updates, reverting:', e);
      }
      fetchState();
      return false;
    }
  };

  const handleUpdateRehearsal = async (id: string, updatedFields: Partial<Rehearsal>) => {
    // Si el ensayo aún no está en la lista (la pantalla «Convocar» manda siempre un id nuevo por
    // esta vía), se AÑADE en vez de ignorarlo: el servidor ya lo crea (upsert) y antes la UI
    // seguía diciendo «no hay ensayos» hasta recargar, con lo que el usuario lo repetía y duplicaba.
    setRehearsals((prev) =>
      prev.some((r) => r.id === id)
        ? prev.map((r) => (r.id === id ? normalizeRehearsal({ ...r, ...updatedFields }) : r))
        : dedupeById([...prev, normalizeRehearsal({ ...updatedFields, id } as Rehearsal)])
    );
    try {
      await api.updateRehearsal(id, updatedFields);
    } catch (e) {
      console.error('Error saving rehearsal updates:', e);
      fetchState();
    }
  };

  const handleUpdateConcert = async (id: string, updatedFields: Partial<Concert>) => {
    setConcerts((prev) =>
      prev.some((c) => c.id === id)
        ? prev.map((c) => (c.id === id ? normalizeConcert({ ...c, ...updatedFields }) : c))
        : dedupeById([...prev, normalizeConcert({ ...updatedFields, id } as Concert)])
    );
    try {
      await api.updateConcert(id, updatedFields);
    } catch (e) {
      console.error('Error saving concert updates:', e);
      fetchState();
    }
  };

  const handleDeleteRehearsal = async (id: string) => {
    const previous = rehearsals;
    setRehearsals((prev) => prev.filter((r) => r.id !== id));
    try {
      await api.deleteRehearsal(id);
    } catch (e) {
      console.error('Error deleting rehearsal, reverting:', e);
      setRehearsals(previous);
    }
  };

  const handleDeleteConcert = async (id: string) => {
    const previous = concerts;
    setConcerts((prev) => prev.filter((c) => c.id !== id));
    try {
      await api.deleteConcert(id);
    } catch (e) {
      console.error('Error deleting concert, reverting:', e);
      setConcerts(previous);
    }
  };

  const handleAddLead = async (newLead: Lead) => {
    setLeads((prev) => dedupeById([...prev.filter((l) => l.id !== newLead.id), newLead]));
    try {
      const res: any = await api.createLead(newLead);
      const serverLead = res?.lead || (res?.id ? res : null);
      if (serverLead) {
        setLeads((prev) => dedupeById([...prev.filter((l) => l.id !== newLead.id && l.id !== serverLead.id), serverLead]));
      }
      if (res?.warning) {
        alert(res.warning);
      }
    } catch (e) {
      console.error('Error adding lead:', e);
      fetchState();
    }
  };

  const handleDeleteLead = async (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    try {
      await api.deleteLead(id);
    } catch (e) {
      console.error('Error deleting lead:', e);
      fetchState();
    }
  };

  const handleBulkDeleteLeads = async (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const idsSet = new Set(ids);
    setLeads((prev) => prev.filter((l) => !idsSet.has(l.id)));
    try {
      await api.bulkDeleteLeads(ids);
    } catch (e) {
      console.error('Error bulk deleting leads:', e);
      fetchState();
    }
  };

  const handleDeleteBand = async (id: string) => {
    try {
      await api.deleteBand(id);
    } catch (e) {
      console.error('Error deleting band:', e);
      fetchState();
    }
  };

  const handleAddRehearsal = async (reh: Rehearsal) => {
    const normalized = normalizeRehearsal(reh);
    setRehearsals((prev) => dedupeById([...prev.filter((r) => r.id !== normalized.id), normalized]));
    try {
      await api.createRehearsal(normalized);
    } catch (e) {
      console.error('Error adding rehearsal:', e);
      fetchState();
    }
  };

  const handleAddConcert = async (concert: Concert) => {
    const normalized = normalizeConcert(concert);
    setConcerts((prev) => dedupeById([...prev.filter((c) => c.id !== normalized.id), normalized]));
    try {
      await api.createConcert(normalized);
    } catch (e) {
      console.error('Error adding concert:', e);
      fetchState();
    }
  };

  const handleAddPost = async (post: SocialPost) => {
    setPosts((prev) => dedupeById([...prev.filter((p) => p.id !== post.id), post]));
    try {
      await api.createPost(post);
    } catch (e) {
      console.error('Error adding social post:', e);
      fetchState();
    }
  };

  const handleUpdatePost = async (id: string, updatedFields: Partial<SocialPost>) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p)));
    try {
      await api.updatePost(id, updatedFields);
    } catch (e) {
      console.error('Error updating social post:', e);
      fetchState();
    }
  };

  const handleAddMetric = async (metric: SocialMetric) => {
    setMetrics((prev) => dedupeById([...prev.filter((m) => m.id !== metric.id), metric]));
    try {
      await api.createMetric(metric);
    } catch (e) {
      console.error('Error adding metric:', e);
      fetchState();
    }
  };

  const handleUpdateMetric = async (id: string, updatedFields: Partial<SocialMetric>) => {
    setMetrics((prev) => prev.map((m) => (m.id === id ? { ...m, ...updatedFields } : m)));
    try {
      await api.updateMetric(id, updatedFields);
    } catch (e) {
      console.error('Error updating metric:', e);
      fetchState();
    }
  };

  const handleDeleteMetric = async (id: string) => {
    setMetrics((prev) => prev.filter((m) => m.id !== id));
    try {
      await api.deleteMetric(id);
    } catch (e) {
      console.error('Error deleting metric:', e);
      fetchState();
    }
  };

  const handleAddPayment = async (pay: Payment) => {
    setPayments((prev) => dedupeById([...prev.filter((p) => p.id !== pay.id), pay]));
    try {
      await api.createPayment(pay);
    } catch (e) {
      console.error('Error adding payment:', e);
      fetchState();
    }
  };

  const handleUpdatePayment = async (id: string, updatedFields: Partial<Payment>) => {
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p)));
    try {
      await api.updatePayment(id, updatedFields);
    } catch (e) {
      console.error('Error updating payment:', e);
      fetchState();
    }
  };

  const handleSaveTour = async (tourData: Tour) => {
    const exists = tours.some((t) => t.id === tourData.id);
    setTours((prev) => dedupeById([...prev.filter((t) => t.id !== tourData.id), tourData]));
    try {
      if (exists) {
        await api.updateTour(tourData.id, tourData);
      } else {
        await api.createTour(tourData);
      }
    } catch (e) {
      console.error('Error saving tour:', e);
      fetchState();
    }
  };

  const handleDeleteTour = async (id: string) => {
    setTours((prev) => prev.filter((t) => t.id !== id));
    try {
      await api.deleteTour(id);
    } catch (e) {
      console.error('Error deleting tour:', e);
      fetchState();
    }
  };

  const handleAddFan = async (fan: Fan) => {
    setFans((prev) => [fan, ...prev]);
    try {
      await api.createFan(fan);
    } catch (e) {
      console.error('Error adding fan:', e);
      fetchState();
    }
  };

  const handleUpdateFan = async (id: string, updatedFields: Partial<Fan>) => {
    setFans((prev) => prev.map((f) => (f.id === id ? { ...f, ...updatedFields } : f)));
    try {
      await api.updateFan(id, updatedFields);
    } catch (e) {
      console.error('Error updating fan:', e);
      fetchState();
    }
  };

  const handleDeleteFan = async (id: string) => {
    setFans((prev) => prev.filter((f) => f.id !== id));
    try {
      await api.deleteFan(id);
    } catch (e) {
      console.error('Error deleting fan:', e);
      fetchState();
    }
  };

  const handleUpdateIncentive = async (newIncentive: NonNullable<EPKConfig['incentivoFans']>) => {
    setEpkConfig((prev) => ({ ...prev, incentivoFans: newIncentive }));
    try {
      await api.updateIncentive(newIncentive);
    } catch (e) {
      console.error('Error updating incentive:', e);
      fetchState();
    }
  };

  const handleSaveCampaign = async (campaignData: Partial<BookingCampaign>) => {
    const dates = campaignData.targetDates || [];
    const formattedDatesText =
      campaignData.targetDatesText ||
      (dates.length > 0
        ? dates
            .map((d) => {
              const parts = d.split('-');
              if (parts.length === 3) {
                const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
              }
              return d;
            })
            .join(', ')
        : 'Sin fechas');

    const campaignId = campaignData.id || `camp-${Date.now()}`;
    const fullCampaign: BookingCampaign = {
      id: campaignId,
      band_id: campaignData.band_id || bandId || 'bakandeya',
      name: campaignData.name || 'Nueva Campaña',
      targetCities: campaignData.targetCities || [],
      minCapacity: Number(campaignData.minCapacity || 0),
      maxCapacity: Number(campaignData.maxCapacity || 0),
      targetDates: dates,
      targetDatesText: formattedDatesText,
      notes: campaignData.notes || '',
      customPitchTemplates: campaignData.customPitchTemplates || {},
      isActive: Boolean(campaignData.isActive),
      color: campaignData.color || 'var(--acc)',
      created_at: campaignData.created_at || new Date().toISOString(),
    };

    setCampaigns((prev) => {
      const exists = prev.some((c) => c.id === fullCampaign.id);
      let next: BookingCampaign[];
      if (exists) {
        next = prev.map((c) => (c.id === fullCampaign.id ? fullCampaign : fullCampaign.isActive ? { ...c, isActive: false } : c));
      } else {
        next = [fullCampaign, ...(fullCampaign.isActive ? prev.map((c) => ({ ...c, isActive: false })) : prev)];
      }
      localStorage.setItem('bandmanager_campaigns', JSON.stringify(next));
      return next;
    });

    if (fullCampaign.isActive) {
      setActiveCampaign(fullCampaign);
      localStorage.setItem('bandmanager_active_campaign', JSON.stringify(fullCampaign));
    }

    try {
      await api.saveCampaign(fullCampaign);
    } catch (e) {
      console.warn('Could not persist campaign to backend:', e);
    }
    return fullCampaign;
  };

  const handleDeleteCampaign = async (id: string) => {
    setCampaigns((prev) => {
      const next = prev.filter((c) => c.id !== id);
      localStorage.setItem('bandmanager_campaigns', JSON.stringify(next));
      return next;
    });
    if (activeCampaign?.id === id) {
      setActiveCampaign(null);
      localStorage.removeItem('bandmanager_active_campaign');
    }
    try {
      await api.deleteCampaign(id);
    } catch (e) {
      console.warn('Could not delete campaign on backend:', e);
    }
  };

  const handleSetActiveCampaign = async (idOrCampaign: string | BookingCampaign | null) => {
    let targetCampaign: BookingCampaign | null = null;
    if (typeof idOrCampaign === 'string') {
      targetCampaign = campaigns.find((c) => c.id === idOrCampaign) || null;
    } else {
      targetCampaign = idOrCampaign;
    }

    setActiveCampaign(targetCampaign);
    if (targetCampaign) {
      localStorage.setItem('bandmanager_active_campaign', JSON.stringify(targetCampaign));
      setCampaigns((prev) => {
        const next = prev.map((c) => ({ ...c, isActive: c.id === targetCampaign!.id }));
        localStorage.setItem('bandmanager_campaigns', JSON.stringify(next));
        return next;
      });
    } else {
      localStorage.removeItem('bandmanager_active_campaign');
      setCampaigns((prev) => {
        const next = prev.map((c) => ({ ...c, isActive: false }));
        localStorage.setItem('bandmanager_campaigns', JSON.stringify(next));
        return next;
      });
    }

    try {
      await api.setActiveCampaign(targetCampaign ? targetCampaign.id : null);
    } catch (e) {
      console.warn('Could not set active campaign on backend:', e);
    }
  };

  return {
    leads,
    rehearsals,
    tours,
    concerts,
    posts,
    payments,
    messages,
    metrics,
    bandUsers,
    fans,
    epkConfig,
    campaigns,
    activeCampaign,
    isLoading,
    syncStatus,
    fetchState,
    handleSaveCampaign,
    handleDeleteCampaign,
    handleSetActiveCampaign,
    handleUpdateEpkConfig,
    handleUpdateLead,
    handleUpdateRehearsal,
    handleUpdateConcert,
    handleDeleteRehearsal,
    handleDeleteConcert,
    handleAddLead,
    handleDeleteLead,
    handleBulkDeleteLeads,
    handleDeleteBand,
    handleAddRehearsal,
    handleAddConcert,
    handleAddPost,
    handleUpdatePost,
    handleAddMetric,
    handleUpdateMetric,
    handleDeleteMetric,
    handleAddPayment,
    handleUpdatePayment,
    handleSaveTour,
    handleDeleteTour,
    handleAddFan,
    handleUpdateFan,
    handleDeleteFan,
    handleUpdateIncentive,
  };
}
