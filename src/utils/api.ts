// Centralized authenticated API fetch helper for Bakandeya App

export async function apiFetch<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('bakandeya_token');
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (options.body && typeof options.body === 'string' && !headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-auth-token'] = token;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Error ${res.status}: ${res.statusText}`);
    }
    return data;
  } else {
    const text = await res.text().catch(() => '');
    if (!res.ok) {
      throw new Error(`Error ${res.status}: ${text.slice(0, 100) || res.statusText}`);
    }
    return { success: true, text } as unknown as T;
  }
}

export async function safeJsonFetch<T = any>(res: Response, fallbackValue: T = {} as T): Promise<T> {
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text().catch(() => '');
    if (!res.ok) {
      throw new Error(`Error ${res.status}: ${text.slice(0, 100) || res.statusText}`);
    }
    return fallbackValue;
  }
  return res.json().catch(() => fallbackValue);
}

