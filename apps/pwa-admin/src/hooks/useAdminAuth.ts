import { useCallback, useEffect, useState } from 'react';
import { api, getStoredToken, setStoredToken } from '@/lib/api';

export interface AdminUser {
  id: number;
  email: string;
}

export function useAdminAuth() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<{ admin: AdminUser }>('/admin/auth/me')
      .then(({ admin }) => setAdmin(admin))
      .catch(() => setStoredToken(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { admin, sessionToken } = await api.post<{
      admin: AdminUser;
      sessionToken: string;
    }>('/admin/auth/login', { email, password });
    setStoredToken(sessionToken);
    setAdmin(admin);
  }, []);

  const logout = useCallback(() => {
    setStoredToken(null);
    setAdmin(null);
    api.post('/admin/auth/logout').catch(() => {
      // сессия уже недействительна на сервере — локально уже вышли
    });
  }, []);

  return { admin, loading, login, logout };
}
