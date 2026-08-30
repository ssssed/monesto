import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api, getStoredToken, setStoredToken } from '@/lib/api';
import { useAdminAuth } from './useAdminAuth';

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api');
  return {
    ...actual,
    api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  };
});

const mockedApi = vi.mocked(api);

describe('useAdminAuth', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('starts logged out with no stored token', async () => {
    const { result } = renderHook(() => useAdminAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.admin).toBeNull();
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('restores the session from a stored token via /admin/auth/me', async () => {
    setStoredToken('existing-token');
    mockedApi.get.mockResolvedValue({ admin: { id: 1, email: 'a@b.com' } });

    const { result } = renderHook(() => useAdminAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.admin).toEqual({ id: 1, email: 'a@b.com' });
  });

  it('clears the stored token when /admin/auth/me rejects', async () => {
    setStoredToken('stale-token');
    mockedApi.get.mockRejectedValue(new Error('unauthorized'));

    const { result } = renderHook(() => useAdminAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.admin).toBeNull();
    expect(getStoredToken()).toBeNull();
  });

  it('login stores the token and sets admin state', async () => {
    mockedApi.post.mockResolvedValue({
      admin: { id: 2, email: 'x@y.com' },
      sessionToken: 'fresh-token',
    });

    const { result } = renderHook(() => useAdminAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login('x@y.com', 'password123');
    });

    expect(getStoredToken()).toBe('fresh-token');
    expect(result.current.admin).toEqual({ id: 2, email: 'x@y.com' });
  });

  it('logout clears the token and admin state immediately', async () => {
    setStoredToken('token');
    mockedApi.get.mockResolvedValue({ admin: { id: 1, email: 'a@b.com' } });
    mockedApi.post.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAdminAuth());
    await waitFor(() => expect(result.current.admin).not.toBeNull());

    act(() => {
      result.current.logout();
    });

    expect(getStoredToken()).toBeNull();
    expect(result.current.admin).toBeNull();
  });
});
