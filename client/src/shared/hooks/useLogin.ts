import { useCallback, useState } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { authApi } from '@/shared/api/auth.api';
import { setUser } from '@/entities/user/user.slice';
import type { LoginRequest } from '@/shared/types';

interface UseLoginReturn {
  login: (data: LoginRequest) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useLogin(): UseLoginReturn {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (data: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const { user, tokens } = await authApi.login(data);
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      dispatch(setUser(user));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  return { login, isLoading, error };
}
