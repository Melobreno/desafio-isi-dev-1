const RAW_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:8080';

function resolveApiBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (trimmed.endsWith('/api/v1')) {
    return trimmed;
  }
  return `${trimmed}/api/v1`;
}

export const API_BASE_URL = resolveApiBaseUrl(RAW_BASE_URL);

export class ApiError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function buildQueryString(
  params: Record<string, string | number | boolean | undefined | null>
): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  }
  const str = searchParams.toString();
  return str ? `?${str}` : '';
}

export async function requestJson<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (options.body !== undefined && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      'Não foi possível carregar os dados. Verifique a conexão e tente de novo.',
      0
    );
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  let parsedBody: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      parsedBody = JSON.parse(text);
    } catch {
      parsedBody = null;
    }
  }

  if (!response.ok) {
    const apiMessage =
      parsedBody &&
      typeof parsedBody === 'object' &&
      'message' in parsedBody &&
      typeof (parsedBody as { message: unknown }).message === 'string' &&
      (parsedBody as { message: string }).message.trim().length > 0
        ? (parsedBody as { message: string }).message
        : `Erro na requisição (${response.status}).`;

    throw new ApiError(apiMessage, response.status);
  }

  return parsedBody as T;
}

export async function requestCsvText(path: string): Promise<string> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'text/csv, application/json',
      },
    });
  } catch {
    throw new ApiError(
      'Não foi possível conectar ao servidor para exportar o CSV.',
      0
    );
  }

  const text = await response.text();
  if (!response.ok) {
    let apiMessage = `Erro ao exportar CSV (${response.status}).`;
    try {
      const parsed = JSON.parse(text) as { message?: string };
      if (parsed && typeof parsed.message === 'string' && parsed.message.trim()) {
        apiMessage = parsed.message;
      }
    } catch {
      apiMessage = `Erro ao exportar CSV (${response.status}).`;
    }
    throw new ApiError(apiMessage, response.status);
  }

  return text;
}

export const apiClient = {
  get<T>(path: string): Promise<T> {
    return requestJson<T>(path, { method: 'GET' });
  },
  post<T>(path: string, body?: unknown): Promise<T> {
    return requestJson<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },
  put<T>(path: string, body: unknown): Promise<T> {
    return requestJson<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
  patch<T>(path: string, body: unknown): Promise<T> {
    return requestJson<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },
  delete<T>(path: string): Promise<T> {
    return requestJson<T>(path, { method: 'DELETE' });
  },
  getText(path: string): Promise<string> {
    return requestCsvText(path);
  },
};
