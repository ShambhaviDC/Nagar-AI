const API_BASE = '/api';

export const getAuthToken = () => localStorage.getItem('nagarai_token');
export const setAuthToken = (token) => localStorage.setItem('nagarai_token', token);
export const removeAuthToken = () => localStorage.removeItem('nagarai_token');

export const apiFetch = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // If body is FormData, don't set Content-Type header
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If token invalid, clear
    if (token && !endpoint.includes('/auth/login')) {
      removeAuthToken();
      window.dispatchEvent(new Event('auth-expired'));
    }
  }

  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data?.detail || data?.message || 'An error occurred';
    throw new Error(errorMsg);
  }

  return data;
};
