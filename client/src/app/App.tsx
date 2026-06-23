import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ErrorBoundary } from '@/app/providers/ErrorBoundary';
import { I18nProvider } from '@/i18n-provider';
import { MusicPlayerProvider } from '@/shared/lib/MusicPlayerContext';
import { MoviePlayerProvider } from '@/shared/lib/MoviePlayerContext';
import { AuthGuard } from '@/features/auth/AuthGuard';
import { GuestGuard } from '@/features/auth/GuestGuard';
import { useAuthInit } from '@/shared/hooks/useAuthInit';
import { MainLayout } from '@/widgets/MainLayout/MainLayout';
import styles from './App.module.css';

const LoginPage = lazy(() => import('@/pages/LoginPage/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/RegisterPage/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const ChatsPage = lazy(() => import('@/pages/ChatsPage/ChatsPage').then((m) => ({ default: m.ChatsPage })));
const ChatDialogPage = lazy(() => import('@/pages/ChatDialogPage/ChatDialogPage').then((m) => ({ default: m.ChatDialogPage })));
const FriendsPage = lazy(() => import('@/pages/FriendsPage/FriendsPage').then((m) => ({ default: m.FriendsPage })));
const MusicPage = lazy(() => import('@/pages/MusicPage/MusicPage').then((m) => ({ default: m.MusicPage })));
const MoviesPage = lazy(() => import('@/pages/MoviesPage/MoviesPage').then((m) => ({ default: m.MoviesPage })));
const FeedPage = lazy(() => import('@/pages/FeedPage/FeedPage').then((m) => ({ default: m.FeedPage })));
const GamesPage = lazy(() => import('@/pages/GamesPage/GamesPage').then((m) => ({ default: m.GamesPage })));
const FightingPage = lazy(() => import('@/pages/GamesPage/FightingPage').then((m) => ({ default: m.FightingPage })));
const TicTacToePage = lazy(() => import('@/pages/GamesPage/TicTacToePage').then((m) => ({ default: m.TicTacToePage })));

const NotFoundPage = () => <div className={styles.notFound}>404 Not Found</div>;

function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthGuard><MusicPlayerProvider>{children}</MusicPlayerProvider></AuthGuard>;
}

function AppRoutes() {
  useAuthInit();

  return (
    <Suspense fallback={<div className={styles.loading} />}>
      <Routes>
        <Route path="/login" element={<GuestGuard><LoginPage /></GuestGuard>} />
        <Route path="/register" element={<GuestGuard><RegisterPage /></GuestGuard>} />
        <Route path="/profile/:id" element={<AuthLayout><MoviePlayerProvider><MainLayout><ProfilePage /></MainLayout></MoviePlayerProvider></AuthLayout>} />
        <Route path="/chats" element={<AuthLayout><ChatsPage /></AuthLayout>} />
        <Route path="/chats/:dialogId" element={<AuthLayout><ChatDialogPage /></AuthLayout>} />
        <Route path="/friends" element={<AuthLayout><MainLayout><FriendsPage /></MainLayout></AuthLayout>} />
        <Route path="/music" element={<AuthLayout><MainLayout><MusicPage /></MainLayout></AuthLayout>} />
        <Route path="/movies" element={<AuthLayout><MoviePlayerProvider><MainLayout><MoviesPage /></MainLayout></MoviePlayerProvider></AuthLayout>} />
        <Route path="/feed" element={<AuthLayout><MainLayout><FeedPage /></MainLayout></AuthLayout>} />
        <Route path="/games" element={<AuthLayout><MainLayout><GamesPage /></MainLayout></AuthLayout>} />
        <Route path="/games/fighting" element={<AuthLayout><MainLayout><FightingPage /></MainLayout></AuthLayout>} />
        <Route path="/games/tic-tac-toe" element={<AuthLayout><MainLayout><TicTacToePage /></MainLayout></AuthLayout>} />
        <Route path="/" element={<Navigate to="/feed" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </I18nProvider>
    </ErrorBoundary>
  );
}
