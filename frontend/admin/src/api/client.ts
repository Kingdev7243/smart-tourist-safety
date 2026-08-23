/**
 * Central API Client for Smart Tourist Safety Backend
 * Configurable API Base URL via VITE_API_BASE_URL (defaults to empty string for same-origin proxy or /api)
 */

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export interface ApiError {
  status: number;
  message: string;
  detail?: any;
}

let onUnauthorizedCallback: (() => void) | null = null;

export function setOnUnauthorizedCallback(callback: () => void) {
  onUnauthorizedCallback = callback;
}

export function getAuthToken(): string | null {
  return localStorage.getItem('tourist_safety_admin_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('tourist_safety_admin_token', token);
  } else {
    localStorage.removeItem('tourist_safety_admin_token');
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      let detail: any = null;

      try {
        const errorJson = await response.json();
        detail = errorJson.detail || errorJson;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail) && detail[0]?.msg) {
          errorMessage = detail.map((d: any) => `${d.loc?.join('.')}: ${d.msg}`).join(', ');
        } else if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch {
        const errorText = await response.text().catch(() => '');
        if (errorText) errorMessage = errorText;
      }

      const error: ApiError = {
        status: response.status,
        message: errorMessage,
        detail,
      };
      throw error;
    }

    // Parse JSON if available
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return (await response.json()) as T;
    }

    return (await response.text()) as unknown as T;
  } catch (err: any) {
    if (err && err.status) {
      throw err;
    }
    // Network or connection failure
    const networkError: ApiError = {
      status: 0,
      message: `Cannot connect to backend service (${url}). Ensure backend is running.`,
      detail: err?.message,
    };
    throw networkError;
  }
}
