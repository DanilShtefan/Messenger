import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ErrorBoundary } from '@/app/providers/ErrorBoundary';
import { MusicPlayerProvider } from '@/shared/lib/MusicPlayerContext';
import { MoviePlayerProvider } from '@/shared/lib/MoviePlayerContext';
import { AuthGuard } from '@/features/auth/AuthGuard';
import { GuestGuard } from '@/features/auth/GuestGuard';
import { useAuthInit } from '@/shared/hooks/useAuthInit';
import { LoginPage } from '@/pages/LoginPage/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage/RegisterPage';
import { ProfilePage } from '@/pages/ProfilePage/ProfilePage';
import { ChatsPage } from '@/pages/ChatsPage/ChatsPage';
import { ChatDialogPage } from '@/pages/ChatDialogPage/ChatDialogPage';
import { FriendsPage } from '@/pages/FriendsPage/FriendsPage';
import { MusicPage } from '@/pages/MusicPage/MusicPage';
import { MoviesPage } from '@/pages/MoviesPage/MoviesPage';
import { MainLayout } from '@/widgets/MainLayout/MainLayout';

const NotFoundPage = () => <div>404 Not Found</div>;

function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthGuard><MusicPlayerProvider>{children}</MusicPlayerProvider></AuthGuard>;
}

function AppRoutes() {
  useAuthInit();

  return (
    <Routes>
      <Route path="/login" element={<GuestGuard><LoginPage /></GuestGuard>} />
      <Route path="/register" element={<GuestGuard><RegisterPage /></GuestGuard>} />
      <Route path="/profile/:id" element={<AuthLayout><MoviePlayerProvider><MainLayout><ProfilePage /></MainLayout></MoviePlayerProvider></AuthLayout>} />
      <Route path="/chats" element={<AuthLayout><ChatsPage /></AuthLayout>} />
      <Route path="/chats/:dialogId" element={<AuthLayout><ChatDialogPage /></AuthLayout>} />
      <Route path="/friends" element={<AuthLayout><MainLayout><FriendsPage /></MainLayout></AuthLayout>} />
      <Route path="/music" element={<AuthLayout><MainLayout><MusicPage /></MainLayout></AuthLayout>} />
      <Route path="/movies" element={<AuthLayout><MoviePlayerProvider><MainLayout><MoviesPage /></MainLayout></MoviePlayerProvider></AuthLayout>} />
      <Route path="/" element={<Navigate to="/chats" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
