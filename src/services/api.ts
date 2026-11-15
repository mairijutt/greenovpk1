export interface VpsStatus {
  endpoint: string;
  isOnline: boolean;
  lastChecked: string | null;
  responseTimeMs: number | null;
  error?: string;
}

const DEFAULT_API_URL = 'https://greenovapk.com/api';

export const getApiBaseUrl = (): string => {
  return localStorage.getItem('greenova_api_url') || DEFAULT_API_URL;
};

export const setApiBaseUrl = (url: string) => {
  localStorage.setItem('greenova_api_url', url);
};

export const getAuthToken = (): string | null => {
  try {
    const raw = localStorage.getItem('greenova_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch {
    return null;
  }
};

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(path, {
    ...options,
    headers,
  });

  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (res.status === 401 && !path.includes('/auth/signin')) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('greenova:unauthorized'));
    }
    throw new Error(payload?.message || 'Session expired. Please sign in again.');
  }

  if (!res.ok) {
    throw new Error(payload?.message || `Server error (${res.status})`);
  }

  return payload as T;
}

export const testVpsConnection = async (customUrl?: string): Promise<VpsStatus> => {
  const endpoint = customUrl || getApiBaseUrl();
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`${endpoint}/health`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    }).catch(async () => {
      return await fetch(endpoint, {
        method: 'HEAD',
        signal: controller.signal,
      });
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;

    return {
      endpoint,
      isOnline: response.ok || response.status < 500,
      lastChecked: new Date().toLocaleTimeString(),
      responseTimeMs: duration,
    };
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    return {
      endpoint,
      isOnline: false,
      lastChecked: new Date().toLocaleTimeString(),
      responseTimeMs: duration,
      error: err instanceof Error ? err.message : 'Connection timed out or network blocked',
    };
  }
};
