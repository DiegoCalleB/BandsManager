import { Lead, Rehearsal, Concert, SocialPost, Payment, SocialMetric, Fan, User, Tour, EPKConfig, Message, GoogleSheetsStatus } from '../types';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('bakandeya_token') || localStorage.getItem('token');
  let activeBandId = '';
  try {
    const userStr = localStorage.getItem('bakandeya_user');
    if (userStr) {
      const u = JSON.parse(userStr);
      if (u?.band_id) activeBandId = u.band_id;
    }
  } catch (e) {}

  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(activeBandId ? { 'x-band-id': activeBandId } : {})
  };
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {})
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 409) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.error || 'Conflicto de sincronización con Google Sheets. Los datos han cambiado en paralelo.',
      409,
      errorData
    );
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.error || `Error en la petición HTTP (${response.status})`,
      response.status,
      errorData
    );
  }

  // Handle empty body responses (e.g., 204 No Content)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json().catch(() => ({} as T)) as Promise<T>;
  }

  return {} as T;
}

export const api = {
  // Authentication
  async verifyMe(): Promise<{ user: User; token?: string; availableBands?: any[]; multipleBands?: boolean }> {
    return request<{ user: User; token?: string; availableBands?: any[]; multipleBands?: boolean }>('/api/auth/me');
  },

  async logout(token: string): Promise<void> {
    await request('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    return request<User>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async setMainBand(band_id: string): Promise<{ success: boolean; user: User; availableBands: any[] }> {
    return request<{ success: boolean; user: User; availableBands: any[] }>('/api/users/set-main-band', {
      method: 'POST',
      body: JSON.stringify({ band_id })
    });
  },

  async setBandOrder(band_order: string[]): Promise<{ success: boolean; user: User; availableBands: any[] }> {
    return request<{ success: boolean; user: User; availableBands: any[] }>('/api/users/set-band-order', {
      method: 'POST',
      body: JSON.stringify({ band_order })
    });
  },

  async createBand(data: {
    bandName: string;
    leaderName?: string;
    contacto_nombre?: string;
    plan?: string;
    estilo_musical?: string;
    localizacion?: string;
  }): Promise<{ success: boolean; message: string; band_id: string; bandName: string; user: User; availableBands: any[] }> {
    return request<{ success: boolean; message: string; band_id: string; bandName: string; user: User; availableBands: any[] }>('/api/users/create-band', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async leaveBand(bandId: string): Promise<{ success: boolean; message?: string; user?: User; availableBands?: any[] }> {
    return request<{ success: boolean; message?: string; user?: User; availableBands?: any[] }>(`/api/users/leave-band/${encodeURIComponent(bandId)}`, {
      method: 'DELETE'
    });
  },

  // Billing & Stripe Checkout
  async createCheckoutSession(data: {
    planId: string;
    billingInterval?: 'monthly' | 'annual';
    bandId?: string;
    userEmail?: string;
  }): Promise<{ success: boolean; url?: string; free?: boolean; message?: string; error?: string }> {
    return request('/api/billing/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        originUrl: typeof window !== 'undefined' ? window.location.origin : undefined
      })
    });
  },

  async startCheckout(options: {
    planId: string;
    billingInterval?: 'monthly' | 'annual';
    bandId?: string;
    userEmail?: string;
  }): Promise<{ success: boolean; url?: string; free?: boolean; message?: string }> {
    const res = await this.createCheckoutSession(options);
    if (res.free) {
      return res;
    }
    if (res.success && res.url) {
      try {
        if (typeof window !== 'undefined' && window.top && window.top !== window.self) {
          const win = window.open(res.url, '_blank');
          if (!win || win.closed || typeof win.closed === 'undefined') {
            window.location.href = res.url;
          }
        } else if (typeof window !== 'undefined') {
          window.location.href = res.url;
        }
      } catch (e) {
        if (typeof window !== 'undefined') {
          window.location.href = res.url;
        }
      }
      return res;
    }
    throw new Error(res.error || 'Error al conectar con la pasarela de pago');
  },

  async consumeCredits(data: {
    bandId?: string;
    userEmail?: string;
    creditsAmount?: number;
    featureName?: string;
  }): Promise<{
    success: boolean;
    exhausted?: boolean;
    creditos_usados?: number;
    creditos_periodo?: number;
    creditos_restantes?: number;
    error?: string;
  }> {
    return request('/api/billing/consume-credits', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getCreditsStatus(params?: {
    bandId?: string;
    userEmail?: string;
  }): Promise<{
    success: boolean;
    plan: string;
    creditos_usados: number;
    creditos_periodo: number;
    creditos_restantes: number;
    estado_suscripcion: string;
    plan_pendiente?: string | null;
    fecha_cambio_plan?: string | null;
  }> {
    const query = new URLSearchParams();
    if (params?.bandId) query.set('bandId', params.bandId);
    if (params?.userEmail) query.set('userEmail', params.userEmail);
    return request(`/api/billing/credits-status?${query.toString()}`);
  },

  // State Fetching
  async getState(): Promise<{
    leads: Lead[];
    rehearsals: Rehearsal[];
    concerts: Concert[];
    posts: SocialPost[];
    payments: Payment[];
    messages: Message[];
    metrics: SocialMetric[];
    users: User[];
    fans: Fan[];
    epkConfig: EPKConfig;
    tours?: Tour[];
  }> {
    return request('/api/state');
  },

  // Google Sheets Verification
  async checkSheets(): Promise<GoogleSheetsStatus> {
    return request('/api/check-sheets');
  },

  // EPK
  async updateEpkConfig(newConfig: Partial<EPKConfig>): Promise<EPKConfig> {
    return request('/api/epk', {
      method: 'PUT',
      body: JSON.stringify(newConfig)
    });
  },

  async updateIncentive(incentivoFans: NonNullable<EPKConfig['incentivoFans']>): Promise<{ ok: boolean }> {
    return request('/api/epk', {
      method: 'PUT',
      body: JSON.stringify({ incentivoFans })
    });
  },

  // Autonomy
  async getAutonomyConfig(): Promise<any> {
    return request('/api/autonomy');
  },

  async updateAutonomyConfig(config: any): Promise<any> {
    return request('/api/autonomy', {
      method: 'POST',
      body: JSON.stringify(config)
    });
  },

  // Leads
  async createLead(lead: Lead): Promise<Lead> {
    return request('/api/leads', {
      method: 'POST',
      body: JSON.stringify(lead)
    });
  },

  async updateLead(id: string, updatedFields: Partial<Lead>, expectedStatus?: string): Promise<Lead> {
    return request(`/api/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...updatedFields, expectedStatus })
    });
  },

  async deleteLead(id: string): Promise<void> {
    return request(`/api/leads/${id}`, {
      method: 'DELETE'
    });
  },

  // Rehearsals
  async createRehearsal(rehearsal: Rehearsal): Promise<Rehearsal> {
    return request('/api/rehearsals', {
      method: 'POST',
      body: JSON.stringify(rehearsal)
    });
  },

  async updateRehearsal(id: string, updatedFields: Partial<Rehearsal>): Promise<Rehearsal> {
    return request(`/api/rehearsals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedFields)
    });
  },

  // Concerts
  async createConcert(concert: Concert): Promise<Concert> {
    return request('/api/concerts', {
      method: 'POST',
      body: JSON.stringify(concert)
    });
  },

  async updateConcert(id: string, updatedFields: Partial<Concert>): Promise<Concert> {
    return request(`/api/concerts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedFields)
    });
  },

  // Social Posts
  async createPost(post: SocialPost): Promise<SocialPost> {
    return request('/api/posts', {
      method: 'POST',
      body: JSON.stringify(post)
    });
  },

  async updatePost(id: string, updatedFields: Partial<SocialPost>): Promise<SocialPost> {
    return request(`/api/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedFields)
    });
  },

  // Social Metrics
  async createMetric(metric: SocialMetric): Promise<SocialMetric> {
    return request('/api/metrics', {
      method: 'POST',
      body: JSON.stringify(metric)
    });
  },

  async updateMetric(id: string, updatedFields: Partial<SocialMetric>): Promise<SocialMetric> {
    return request(`/api/metrics/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedFields)
    });
  },

  async deleteMetric(id: string): Promise<void> {
    return request(`/api/metrics/${id}`, {
      method: 'DELETE'
    });
  },

  async getSocialContentItems(platform?: string): Promise<any[]> {
    const url = platform ? `/api/metrics/content-items?platform=${platform}` : '/api/metrics/content-items';
    const res = await request(url);
    return res?.items || [];
  },

  async triggerRadarScan(): Promise<any> {
    return request('/api/metrics/cron-snapshot-all', {
      method: 'POST'
    });
  },

  // Payments / Finanzas
  async createPayment(payment: Payment): Promise<Payment> {
    return request('/api/payments', {
      method: 'POST',
      body: JSON.stringify(payment)
    });
  },

  async updatePayment(id: string, updatedFields: Partial<Payment>): Promise<Payment> {
    return request(`/api/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedFields)
    });
  },

  // Tours
  async createTour(tour: Tour): Promise<Tour> {
    return request('/api/tours', {
      method: 'POST',
      body: JSON.stringify(tour)
    });
  },

  async updateTour(id: string, tour: Tour): Promise<Tour> {
    return request(`/api/tours/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tour)
    });
  },

  async deleteTour(id: string): Promise<void> {
    return request(`/api/tours/${id}`, {
      method: 'DELETE'
    });
  },

  // Bands
  async getBands(): Promise<{ bands: any[] }> {
    return request<{ bands: any[] }>('/api/bands');
  },

  async deleteBand(id: string): Promise<void> {
    return request(`/api/bands/${id}`, {
      method: 'DELETE'
    });
  },

  async getRegisteredBands(): Promise<{ registeredBands: any[] }> {
    return request<{ registeredBands: any[] }>('/api/registered-bands');
  },

  // Schedules (Smart Gate)
  async getBandSchedule(bandId: string): Promise<any> {
    return request(`/api/bands/schedules/${encodeURIComponent(bandId)}`);
  },

  async saveBandSchedule(schedule: {
    band_id: string;
    timezone: string;
    horas_lector: number[];
    horas_enviador: number[];
    dias_enviador?: number[];
    dias_lector?: number[];
  }): Promise<any> {
    return request('/api/bands/schedules', {
      method: 'POST',
      body: JSON.stringify(schedule)
    });
  },

  // Fans
  async createFan(fan: Fan): Promise<Fan> {
    return request('/api/fans', {
      method: 'POST',
      body: JSON.stringify(fan)
    });
  },

  async deleteFan(id: string): Promise<void> {
    return request(`/api/fans/${id}`, {
      method: 'DELETE'
    });
  },

  // Billing
  async confirmPaymentSuccess(data: { planId: string; bandId?: string; userEmail?: string }): Promise<any> {
    return request('/api/billing/confirm-success', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async createPortalSession(data: {
    userEmail?: string;
    bandId?: string;
    returnUrl?: string;
  }): Promise<{ success: boolean; url?: string; error?: string }> {
    return request('/api/billing/create-portal-session', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Instagram Meta Graph API & OAuth
  async getInstagramStatus(): Promise<{ success: boolean; connected: boolean; method?: string; account?: any; error?: string }> {
    return request('/api/metrics/instagram/status');
  },

  async connectInstagramToken(accessToken: string): Promise<{ success: boolean; message: string; account?: any }> {
    return request('/api/metrics/instagram/connect', {
      method: 'POST',
      body: JSON.stringify({ accessToken })
    });
  },

  async disconnectInstagram(): Promise<{ success: boolean; message: string }> {
    return request('/api/metrics/instagram/disconnect', {
      method: 'POST'
    });
  },

  // Screenshot scanner with Gemini Multimodal Vision
  async scanMetricsScreenshot(image: string, mimeType?: string, autoSave: boolean = true): Promise<{ success: boolean; data?: any; savedToSupabase?: boolean; metric?: any; error?: string }> {
    return request('/api/metrics/scan-screenshot', {
      method: 'POST',
      body: JSON.stringify({ image, mimeType, autoSave })
    });
  },

  // AI Growth Plan & Multiplatform Recommendations
  async generateSocialGrowthPlan(data: {
    bandName: string;
    metrics: any;
    epkConfig?: any;
    horizonDays?: number;
    customFocus?: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    return request('/api/metrics/generate-growth-plan', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

