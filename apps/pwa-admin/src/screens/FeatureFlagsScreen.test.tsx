import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import { FeatureFlagsScreen } from './FeatureFlagsScreen';

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api');
  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

const mockedApi = vi.mocked(api);

describe('FeatureFlagsScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and renders flags from the API', async () => {
    mockedApi.get.mockResolvedValue([
      { key: 'year_summary', enabled: true, description: 'Show summary', updatedAt: '' },
    ]);

    render(<FeatureFlagsScreen onLogout={vi.fn()} />);

    expect(await screen.findByText('year_summary')).toBeInTheDocument();
    expect(screen.getByText('Show summary')).toBeInTheDocument();
    expect(mockedApi.get).toHaveBeenCalledWith('/admin/feature-flags');
  });

  it('toggles a flag via PATCH and reflects the server response', async () => {
    mockedApi.get.mockResolvedValue([
      { key: 'year_summary', enabled: false, description: null, updatedAt: '' },
    ]);
    mockedApi.patch.mockResolvedValue({
      key: 'year_summary',
      enabled: true,
      description: null,
      updatedAt: '',
    });

    render(<FeatureFlagsScreen onLogout={vi.fn()} />);
    const toggle = await screen.findByLabelText('toggle-year_summary');

    fireEvent.click(toggle);

    await waitFor(() =>
      expect(mockedApi.patch).toHaveBeenCalledWith('/admin/feature-flags/year_summary', {
        enabled: true,
      }),
    );
  });

  it('deletes a flag via DELETE and removes it from the list', async () => {
    mockedApi.get.mockResolvedValue([
      { key: 'year_summary', enabled: false, description: null, updatedAt: '' },
    ]);
    mockedApi.delete.mockResolvedValue(undefined);

    render(<FeatureFlagsScreen onLogout={vi.fn()} />);
    await screen.findByText('year_summary');

    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));

    await waitFor(() =>
      expect(mockedApi.delete).toHaveBeenCalledWith('/admin/feature-flags/year_summary'),
    );
    await waitFor(() => expect(screen.queryByText('year_summary')).not.toBeInTheDocument());
  });

  it('creates a new flag through the sheet form', async () => {
    mockedApi.get.mockResolvedValue([]);
    mockedApi.post.mockResolvedValue({
      key: 'new_flag',
      enabled: false,
      description: null,
      updatedAt: '',
    });

    render(<FeatureFlagsScreen onLogout={vi.fn()} />);
    await screen.findByText('Пока нет ни одного флага');

    fireEvent.click(screen.getByRole('button', { name: 'Создать флаг' }));
    fireEvent.change(await screen.findByLabelText('Ключ'), {
      target: { value: 'new_flag' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Создать' }));

    await waitFor(() =>
      expect(mockedApi.post).toHaveBeenCalledWith('/admin/feature-flags', {
        key: 'new_flag',
        description: undefined,
      }),
    );
    expect(await screen.findByText('new_flag')).toBeInTheDocument();
  });

  it('calls onLogout when the logout button is clicked', async () => {
    mockedApi.get.mockResolvedValue([]);
    const onLogout = vi.fn();
    render(<FeatureFlagsScreen onLogout={onLogout} />);
    await screen.findByText('Пока нет ни одного флага');

    fireEvent.click(screen.getByRole('button', { name: 'Выйти' }));
    expect(onLogout).toHaveBeenCalled();
  });
});
