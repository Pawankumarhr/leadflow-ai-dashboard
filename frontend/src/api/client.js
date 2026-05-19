const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getToken = () => localStorage.getItem('leadflow_token');
const getRefreshToken = () => localStorage.getItem('leadflow_refresh');

let refreshPromise = null;

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
      return response.json();
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

const request = async (path, { method = 'GET', body, headers, retry = true } = {}) => {
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
      return request(path, { method, body, headers, retry: false });
    }
  }

  if (!response.ok) {
    const detailMessage = Array.isArray(payload?.details)
      ? payload.details.join(', ')
      : null;
    const message = payload?.message || detailMessage || 'Request failed';
    throw new Error(message);
  }

  return payload;
};

const download = async (path, retry = true) => {
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
