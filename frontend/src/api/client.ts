const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
  retry?: boolean;
};

type RefreshPayload = {
  token: string;
  refreshToken: string;
};

const getToken = () => localStorage.getItem('leadflow_token');
const getRefreshToken = () => localStorage.getItem('leadflow_refresh');

let refreshPromise: Promise<string | null> | null = null;

const refreshSession = async () => {
  if (refreshPromise) return refreshPromise;

  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  refreshPromise = fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error('Refresh failed');
      }
      return response.json() as Promise<RefreshPayload>;
    })
    .then((payload) => {
      localStorage.setItem('leadflow_token', payload.token);
      localStorage.setItem('leadflow_refresh', payload.refreshToken);
      return payload.token;
    })
    .catch(() => {
      localStorage.removeItem('leadflow_token');
      localStorage.removeItem('leadflow_refresh');
      window.dispatchEvent(new Event('leadflow:logout'));
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

const request = async <T>(path: string, { method = 'GET', body, headers, retry = true }: RequestOptions = {}): Promise<T> => {
  const token = getToken();

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (response.status === 401 && retry) {
    const newToken = await refreshSession();
    if (newToken) {
      return request<T>(path, { method, body, headers, retry: false });
    }
  }

  if (!response.ok) {
    const details = Array.isArray((payload as { details?: string[] })?.details)
      ? (payload as { details: string[] }).details.join(', ')
      : null;
    const message = (payload as { message?: string })?.message || details || 'Request failed';
    throw new Error(message);
  }

  return payload as T;
};

const download = async (path: string, retry = true): Promise<Blob> => {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (response.status === 401 && retry) {
    const newToken = await refreshSession();
    if (newToken) {
      return download(path, false);
    }
  }

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(payload || 'Download failed');
  }

  return response.blob();
};

export { request, download, API_URL };
