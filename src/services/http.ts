import { tokenStorage } from './token.storage';

export const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

function buildQueryString(
  params?: Record<string, string | number | boolean | null | undefined>,
): string {
  if (!params) return '';
  const query = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, String(val));
    }
  }
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

async function request<T>(
  method: string,
  path: string,
  options: { body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const { body, auth = true } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = tokenStorage.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  const init: RequestInit = {
    method,
    headers,
    body: body === undefined ? null : JSON.stringify(body),
  };

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, init);
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor backend');
  }

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(data?.message)
      ? data.message.join('\n')
      : (data?.message ?? 'Erro inesperado');

    if (response.status === 401 && auth && token) {
      onUnauthorized?.();
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const http = {
  get: <T>(
    path: string,
    params?: Record<string, string | number | boolean | null | undefined>,
  ) => request<T>('GET', `${path}${buildQueryString(params)}`),
  post: <T>(path: string, body?: unknown, auth = true) =>
    request<T>('POST', path, { body, auth }),
  patch: <T>(path: string, body?: unknown, auth = true) =>
    request<T>('PATCH', path, { body, auth }),
  delete: <T>(path: string, auth = true) =>
    request<T>('DELETE', path, { auth }),
};

