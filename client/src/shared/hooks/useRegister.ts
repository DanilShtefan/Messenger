import { useCallback, useState } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { authApi } from '@/shared/api/auth.api';
import { setUser } from '@/entities/user/user.slice';
import type { RegisterRequest } from '@/shared/types';

interface UseRegisterReturn {
  register: (data: RegisterRequest) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useRegister(): UseRegisterReturn {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(async (data: RegisterRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const { user, tokens } = await authApi.register(data);
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      dispatch(setUser(user));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  return { register, isLoading, error };
}
