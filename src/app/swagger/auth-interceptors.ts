/** These functions are serialized by Swagger UI; keep browser logic self-contained. */
interface SwaggerWindow extends Window {
  ui?: {
    preauthorizeApiKey(name: string, token: string): void;
    authActions: { logout(names: string[]): void };
  };
  swaggerAccessToken?: string;
  swaggerRefreshPending?: Promise<string | undefined>;
}
interface SwaggerRequest {
  url: string;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
}
interface SwaggerResponse {
  url?: string;
  status: number;
  obj?: unknown;
  body?: unknown;
}

export async function swaggerRequestInterceptor(request: SwaggerRequest) {
  const browser = window as SwaggerWindow;
  request.credentials = 'include';
  const url = new URL(request.url, browser.location.href);
  const apiIndex = url.pathname.indexOf('/api/v1/');
  if (url.origin !== browser.location.origin || apiIndex < 0) return request;
  const endpoint = url.pathname.slice(apiIndex + '/api/v1'.length);
  if (
    /^\/auth\/(login|register|refresh|logout|forgot-password|verify|reset-password)\/?$/.test(
      endpoint,
    )
  )
    return request;

  request.headers ??= {};
  const header = request.headers.Authorization ?? request.headers.authorization;
  let token = header?.replace(/^Bearer\s+/i, '') || browser.swaggerAccessToken;
  let needsRefresh = !token;
  if (token) {
    try {
      const payload = JSON.parse(
        browser.atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
      ) as { exp?: number };
      needsRefresh = !payload.exp || payload.exp * 1000 <= Date.now() + 5000;
    } catch {
      needsRefresh = true;
    }
  }
  if (needsRefresh) {
    if (!browser.swaggerRefreshPending) {
      const refreshUrl =
        url.origin + url.pathname.slice(0, apiIndex) + '/api/v1/auth/refresh';
      browser.swaggerRefreshPending = (async () => {
        try {
          const response = await browser.fetch(refreshUrl, {
            method: 'POST',
            credentials: 'include',
          });
          if (!response.ok) {
            if (response.status === 401) {
              browser.swaggerAccessToken = undefined;
              browser.ui?.authActions.logout(['access-token']);
            }
            return undefined;
          }
          const body = (await response.json()) as {
            data?: { accessToken?: string };
          };
          const refreshed = body.data?.accessToken;
          if (typeof refreshed !== 'string' || !refreshed) return undefined;
          browser.swaggerAccessToken = refreshed;
          browser.ui?.preauthorizeApiKey('access-token', refreshed);
          return refreshed;
        } catch {
          return undefined;
        }
      })();
    }
    const pending = browser.swaggerRefreshPending;
    try {
      token = await pending;
    } finally {
      if (browser.swaggerRefreshPending === pending)
        browser.swaggerRefreshPending = undefined;
    }
  }
  delete request.headers.authorization;
  if (token) request.headers.Authorization = 'Bearer ' + token;
  else delete request.headers.Authorization;
  return request;
}

export function swaggerResponseInterceptor(response: SwaggerResponse) {
  const browser = window as SwaggerWindow;
  const url = new URL(response.url ?? '', browser.location.href);
  if (
    url.origin !== browser.location.origin ||
    response.status < 200 ||
    response.status >= 300
  )
    return response;
  if (/\/api\/v1\/auth\/logout\/?$/.test(url.pathname)) {
    browser.swaggerAccessToken = undefined;
    browser.ui?.authActions.logout(['access-token']);
    return response;
  }
  if (!/\/api\/v1\/auth\/(login|refresh)\/?$/.test(url.pathname))
    return response;
  let body = response.obj ?? response.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return response;
    }
  }
  const token = (body as { data?: { accessToken?: unknown } } | undefined)?.data
    ?.accessToken;
  if (typeof token === 'string' && token) {
    browser.swaggerAccessToken = token;
    browser.ui?.preauthorizeApiKey('access-token', token);
  }
  return response;
}

/** Remove only the retired Swagger credential; the real HttpOnly cookie stays intact. */
export function swaggerOnComplete() {
  const browser = window as SwaggerWindow;
  browser.ui?.authActions.logout(['refresh-cookie']);
}
