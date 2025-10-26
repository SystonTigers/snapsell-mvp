export type ApiErrorPayload = {
  ok: false;
  error: string;
};

type ApiRequestInit = Omit<RequestInit, 'body'> & { body?: unknown };

type FetchOptions<T> = ApiRequestInit & {
  schema?: (data: unknown) => T;
};

const defaultHeaders = {
  'content-type': 'application/json',
};

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly payload?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

export const createApiClient = (baseUrl: string) => {
  const normalisedBase = baseUrl.replace(/\/$/, '');

  async function request<T = unknown>(path: string, options: FetchOptions<T> = {}): Promise<T> {
    const url = `${normalisedBase}${path.startsWith('/') ? path : `/${path}`}`;
    const { body, schema, headers, ...rest } = options;

    const init: RequestInit = {
      ...rest,
      headers: {
        ...defaultHeaders,
        ...headers,
      },
    };

    if (body !== undefined) {
      init.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetch(url, init);
    const text = await response.text();
    const payload = text ? safeParseJson(text) : undefined;

    if (!response.ok) {
      const message = typeof (payload as ApiErrorPayload | undefined)?.error === 'string'
        ? (payload as ApiErrorPayload).error
        : `Request failed with status ${response.status}`;
      throw new ApiError(message, response.status, payload);
    }

    const data = payload ?? ({} as unknown);
    return schema ? schema(data) : (data as T);
  }

  return {
    get: <T = unknown>(path: string, options: FetchOptions<T> = {}) => request<T>(path, { ...options, method: 'GET' }),
    post: <T = unknown>(path: string, body?: unknown, options: FetchOptions<T> = {}) =>
      request<T>(path, { ...options, method: 'POST', body }),
    request,
  };
};

const safeParseJson = (input: string): unknown => {
  try {
    return JSON.parse(input);
  } catch (error) {
    console.warn('Failed to parse API response JSON', (error as Error).message);
    return undefined;
  }
};
