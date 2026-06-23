import { useCallback } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { authApi } from '@/shared/api/auth.api';
import { logout } from '@/entities/user/user.slice';
import { disconnectSocket } from '@/shared/lib/socket';

export function useLogout() {
  const dispatch = useAppDispatch();

  const handleLogout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // ignore — we clear locally anyway
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      disconnectSocket();
      dispatch(logout());
    }
  }, [dispatch]);

  return handleLogout;
}
