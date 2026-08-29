import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api';
import { LoginScreen } from './LoginScreen';

describe('LoginScreen', () => {
  it('calls onLogin with the entered email and password', async () => {
    const onLogin = vi.fn().mockResolvedValue(undefined);
    render(<LoginScreen onLogin={onLogin} />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'admin@monesto.app' },
    });
    fireEvent.change(screen.getByLabelText('Пароль'), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() =>
      expect(onLogin).toHaveBeenCalledWith('admin@monesto.app', 'secret123'),
    );
  });

  it('shows the ApiError message when login fails', async () => {
    const onLogin = vi.fn().mockRejectedValue(new ApiError(401, 'Неверный email или пароль'));
    render(<LoginScreen onLogin={onLogin} />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'admin@monesto.app' },
    });
    fireEvent.change(screen.getByLabelText('Пароль'), {
      target: { value: 'wrong' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

    expect(await screen.findByText('Неверный email или пароль')).toBeInTheDocument();
  });
});
