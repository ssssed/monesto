import { useEffect, useState, type FormEvent } from 'react';
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Switch,
} from '@monesto/rune';
import { api, ApiError } from '@/lib/api';

interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string | null;
  updatedAt: string;
}

export function FeatureFlagsScreen({ onLogout }: { onLogout: () => void }) {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const loadFlags = async () => {
    setLoading(true);
    try {
      const data = await api.get<FeatureFlag[]>('/admin/feature-flags');
      setFlags(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить флаги');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlags();
  }, []);

  const toggleFlag = async (flag: FeatureFlag) => {
    const updated = await api.patch<FeatureFlag>(
      `/admin/feature-flags/${flag.key}`,
      { enabled: !flag.enabled },
    );
    setFlags((prev) => prev.map((f) => (f.key === flag.key ? updated : f)));
  };

  const removeFlag = async (key: string) => {
    await api.delete(`/admin/feature-flags/${key}`);
    setFlags((prev) => prev.filter((f) => f.key !== key));
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!newKey.trim()) {
      setCreateError('Ключ обязателен');
      return;
    }
    try {
      const created = await api.post<FeatureFlag>('/admin/feature-flags', {
        key: newKey.trim(),
        description: newDescription.trim() || undefined,
      });
      setFlags((prev) =>
        [...prev, created].sort((a, b) => a.key.localeCompare(b.key)),
      );
      setNewKey('');
      setNewDescription('');
      setCreateError(null);
      setIsCreateOpen(false);
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : 'Не удалось создать флаг');
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Фичафлаги</h1>
        <div className="flex gap-2">
          <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <SheetTrigger asChild>
              <Button size="sm">Создать флаг</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Новый флаг</SheetTitle>
              </SheetHeader>
              <SheetBody>
                <form
                  id="create-flag-form"
                  onSubmit={handleCreate}
                  className="flex flex-col gap-4"
                >
                  <div>
                    <Label htmlFor="key">Ключ</Label>
                    <Input
                      id="key"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      placeholder="year_summary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Описание</Label>
                    <Input
                      id="description"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                    />
                  </div>
                  {createError ? (
                    <p className="text-sm text-red-600">{createError}</p>
                  ) : null}
                </form>
              </SheetBody>
              <SheetFooter>
                <Button type="submit" form="create-flag-form">
                  Создать
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          <Button variant="outline" size="sm" onClick={onLogout}>
            Выйти
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-slate-500">Загрузка...</p>
      ) : flags.length === 0 ? (
        <p className="text-sm text-slate-500">Пока нет ни одного флага</p>
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {flags.map((flag) => (
              <div
                key={flag.key}
                className="flex items-center justify-between gap-4 p-4"
              >
                <div>
                  <p className="font-medium">{flag.key}</p>
                  {flag.description ? (
                    <p className="text-sm text-slate-500">{flag.description}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={flag.enabled}
                    onCheckedChange={() => toggleFlag(flag)}
                    aria-label={`toggle-${flag.key}`}
                  />
                  <Button variant="ghost" size="sm" onClick={() => removeFlag(flag.key)}>
                    Удалить
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
