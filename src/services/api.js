const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export async function apiClient(endpoint, options = {}) {
  const url = `${BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'X-Client': 'CryptSentinel-Web',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const error = new Error(errorBody.message || `HTTP Error ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.data = errorBody;
      throw error;
    }
    return await response.json();
  } catch (err) {
    // If backend is unreachable, return null or throw with descriptive flag
    console.warn(`[CryptSentinel API] Error calling ${url}:`, err.message);
    throw err;
  }
}
