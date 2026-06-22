import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { authApi } from '@/shared/api/auth.api';
import { setUser } from '@/entities/user/user.slice';

export function useAuthInit() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.user.isAuthenticated);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token || isAuthenticated) return;

    authApi
      .getMe()
      .then((user) => dispatch(setUser(user)))
      .catch(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      });
  }, [dispatch, isAuthenticated]);
}
