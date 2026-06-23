import { apiClient } from './axiosInstance';
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '@/shared/types';

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  logout: (refreshToken: string) =>
    apiClient.post<void>('/auth/logout', { refreshToken }).then((r) => r.data),

  refresh: (refreshToken: string) =>
    apiClient.post<{ accessToken: string }>('/auth/refresh', { refreshToken }).then((r) => r.data),

  getMe: () =>
    apiClient.get<User>('/auth/me').then((r) => r.data),
};
