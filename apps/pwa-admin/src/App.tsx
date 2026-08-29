import { useAdminAuth } from '@/hooks/useAdminAuth';
import { FeatureFlagsScreen } from '@/screens/FeatureFlagsScreen';
import { LoginScreen } from '@/screens/LoginScreen';

export function App() {
  const { admin, loading, login, logout } = useAdminAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Загрузка...</p>
      </div>
    );
  }

  if (!admin) {
    return <LoginScreen onLogin={login} />;
  }

  return <FeatureFlagsScreen onLogout={logout} />;
}
