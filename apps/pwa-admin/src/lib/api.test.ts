import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError, getStoredToken, setStoredToken } from './api';

describe('api client', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('setStoredToken/getStoredToken round-trip through localStorage', () => {
    expect(getStoredToken()).toBeNull();
    setStoredToken('abc');
    expect(getStoredToken()).toBe('abc');
    setStoredToken(null);
    expect(getStoredToken()).toBeNull();
  });

  it('attaches the Authorization header when a token is stored', async () => {
    setStoredToken('my-token');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await api.get('/admin/feature-flags');

    const [, options] = fetchMock.mock.calls[0];
    const headers = options.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer my-token');
  });

  it('omits the Authorization header when no token is stored', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal('fetch', fetchMock);

    await api.get('/feature-flags');

    const [, options] = fetchMock.mock.calls[0];
    const headers = options.headers as Headers;
    expect(headers.get('Authorization')).toBeNull();
  });

  it('throws ApiError with the server message on a non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ message: 'Не авторизован' }),
      }),
    );

    await expect(api.get('/admin/auth/me')).rejects.toMatchObject({
      status: 401,
      message: 'Не авторизован',
    });
  });

  it('joins array validation messages into one string', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ message: ['email must be an email', 'password too short'] }),
      }),
    );

    await expect(api.post('/admin/auth/login', {})).rejects.toThrow(
      'email must be an email, password too short',
    );
  });

  it('returns undefined for a 204 No Content response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 204, json: () => Promise.resolve(null) }),
    );

    await expect(api.delete('/admin/feature-flags/x')).resolves.toBeUndefined();
  });

  it('serializes the body and sends the correct HTTP method for post/patch/delete', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({}) });
    vi.stubGlobal('fetch', fetchMock);

    await api.post('/admin/feature-flags', { key: 'a' });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ key: 'a' }),
    });

    await api.patch('/admin/feature-flags/a', { enabled: true });
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: 'PATCH',
      body: JSON.stringify({ enabled: true }),
    });

    await api.delete('/admin/feature-flags/a');
    expect(fetchMock.mock.calls[2][1]).toMatchObject({ method: 'DELETE' });
  });

  it('ApiError carries the HTTP status code', () => {
    const error = new ApiError(404, 'not found');
    expect(error.status).toBe(404);
    expect(error.message).toBe('not found');
  });
});
