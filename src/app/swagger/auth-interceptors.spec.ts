import {
  swaggerOnComplete,
  swaggerRequestInterceptor,
  swaggerResponseInterceptor,
} from './auth-interceptors';

describe('Swagger automatic access-token refresh', () => {
  const token = (seconds: number) =>
    'header.' +
    Buffer.from(
      JSON.stringify({ exp: Math.floor(Date.now() / 1000) + seconds }),
    ).toString('base64url') +
    '.signature';
  let browser: any;
  beforeEach(() => {
    browser = {
      location: {
        origin: 'http://localhost:3000',
        href: 'http://localhost:3000/api/docs',
      },
      atob: (value: string) => Buffer.from(value, 'base64').toString(),
      fetch: jest.fn(),
      ui: { preauthorizeApiKey: jest.fn(), authActions: { logout: jest.fn() } },
    };
    Object.defineProperty(globalThis, 'window', {
      value: browser,
      configurable: true,
      writable: true,
    });
  });
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'window');
  });
  it('removes the obsolete cookie authorization while keeping the access token', () => {
    browser.swaggerAccessToken = 'current-access-token';
    swaggerOnComplete();
    expect(browser.ui.authActions.logout).toHaveBeenCalledWith([
      'refresh-cookie',
    ]);
    expect(browser.swaggerAccessToken).toBe('current-access-token');
  });
  it('automatically authorizes the token from a successful login response', () => {
    swaggerResponseInterceptor({
      url: 'http://localhost:3000/api/v1/auth/login',
      status: 200,
      obj: { data: { accessToken: 'login-token' } },
    });
    expect(browser.ui.preauthorizeApiKey).toHaveBeenCalledWith(
      'access-token',
      'login-token',
    );
    expect(browser.swaggerAccessToken).toBe('login-token');
  });
  it('uses a fresh token without calling refresh', async () => {
    const accessToken = token(3600);
    browser.swaggerAccessToken = accessToken;
    const result = await swaggerRequestInterceptor({
      url: '/api/v1/user/profile',
      headers: {},
    });
    expect(result.headers?.Authorization).toBe('Bearer ' + accessToken);
    expect(result.credentials).toBe('include');
    expect(browser.fetch).not.toHaveBeenCalled();
  });
  it('coalesces concurrent expired-token requests into one cookie refresh', async () => {
    const fresh = token(3600);
    browser.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { accessToken: fresh } }),
    });
    const requests = await Promise.all(
      [1, 2].map(() =>
        swaggerRequestInterceptor({
          url: '/api/v1/user/profile',
          headers: { Authorization: 'Bearer ' + token(-10) },
        }),
      ),
    );
    expect(browser.fetch).toHaveBeenCalledTimes(1);
    expect(browser.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/auth/refresh',
      { method: 'POST', credentials: 'include' },
    );
    requests.forEach((request) =>
      expect(request.headers?.Authorization).toBe('Bearer ' + fresh),
    );
  });
  it('restores the access token from a cookie after a page reload', async () => {
    browser.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { accessToken: 'restored-token' } }),
    });
    expect(
      (await swaggerRequestInterceptor({ url: '/api/v1/dashboard/me' })).headers
        ?.Authorization,
    ).toBe('Bearer restored-token');
  });
  it('does not recursively refresh login or refresh requests', async () => {
    await swaggerRequestInterceptor({ url: '/api/v1/auth/login' });
    await swaggerRequestInterceptor({ url: '/api/v1/auth/refresh' });
    expect(browser.fetch).not.toHaveBeenCalled();
  });
  it('clears stale authorization if the refresh session has expired', async () => {
    browser.fetch.mockResolvedValue({ ok: false, status: 401 });
    const result = await swaggerRequestInterceptor({
      url: '/api/v1/user/profile',
      headers: { Authorization: 'Bearer ' + token(-10) },
    });
    expect(result.headers?.Authorization).toBeUndefined();
    expect(browser.ui.authActions.logout).toHaveBeenCalledWith([
      'access-token',
    ]);
  });
  it('clears Swagger authorization on logout', () => {
    browser.swaggerAccessToken = 'old-token';
    swaggerResponseInterceptor({ url: '/api/v1/auth/logout', status: 200 });
    expect(browser.swaggerAccessToken).toBeUndefined();
    expect(browser.ui.authActions.logout).toHaveBeenCalledWith([
      'access-token',
    ]);
  });
  it('never attaches the saved token to another origin', async () => {
    browser.swaggerAccessToken = 'private-token';
    const response = await swaggerRequestInterceptor({
      url: 'https://example.org/api/v1/profile',
    });
    expect(response.headers?.Authorization).toBeUndefined();
    expect(browser.fetch).not.toHaveBeenCalled();
  });
});
