import { getSupabaseBrowserClient } from './supabase/browserClient';

const isDevMode = process.env.NODE_ENV !== 'production';

const getApiBaseUrl = () => {
  const devUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const prodUrl = process.env.NEXT_PUBLIC_PRODUCTION_URL;
  return (isDevMode ? devUrl : prodUrl) || devUrl || '';
};

const normalizePath = (path: string) => {
  return path.startsWith('/') ? path : `/${path}`;
};

export class ApiError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

const parseResponsePayload = async (response: Response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
};

const getErrorMessage = (status: number, payload: unknown) => {
  if (status === 401) {
    return 'Unauthorized. Please log in again.';
  }
  if (status >= 500) {
    return 'Server error. Please try again shortly.';
  }
  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }
  if (payload && typeof payload === 'object' && 'detail' in payload) {
    const detail = (payload as { detail?: unknown }).detail;
    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }
  }
  return `Request failed with status ${status}`;
};

export const buildApiUrl = (path: string) => {
  return `${getApiBaseUrl()}${normalizePath(path)}`;
};

export const getAccessToken = async () => {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new ApiError(error.message, 401);
  }

  let token = data.session?.access_token;
  if (!token) {
    const { data: refreshedData, error: refreshError } =
      await supabase.auth.refreshSession();
    if (refreshError) {
      throw new ApiError(refreshError.message, 401);
    }
    token = refreshedData.session?.access_token;
  }

  if (!token) {
    throw new ApiError('No active session found.', 401);
  }

  return token;
};

type ApiRequestOptions = Omit<RequestInit, 'body' | 'headers'> & {
  body?: unknown;
  headers?: HeadersInit;
  auth?: boolean;
};

export const apiRequest = async <T>(
  path: string,
  options: ApiRequestOptions = {},
) => {
  const { body, headers, auth = false, ...rest } = options;
  const finalHeaders = new Headers(headers);
  finalHeaders.set('Accept', 'application/json');

  if (body !== undefined) {
    finalHeaders.set('Content-Type', 'application/json');
  }

  if (auth) {
    const token = await getAccessToken();
    finalHeaders.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(buildApiUrl(path), {
    ...rest,
    headers: finalHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });

  if (!response.ok) {
    const payload = await parseResponsePayload(response);
    throw new ApiError(
      getErrorMessage(response.status, payload),
      response.status,
      payload,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await parseResponsePayload(response);
  return payload as T;
};

export const protectedApiRequest = async <T>(
  path: string,
  options: Omit<ApiRequestOptions, 'auth'> = {},
) => {
  return apiRequest<T>(path, { ...options, auth: true });
};
