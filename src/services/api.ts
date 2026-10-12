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

export const testVpsConnection = async (customUrl?: string): Promise<VpsStatus> => {
  const endpoint = customUrl || getApiBaseUrl();
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`${endpoint}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    }).catch(async () => {
      // Fallback probe to root or options if /health is not defined
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
