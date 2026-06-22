import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '@/app/providers/ErrorBoundary';
import { MusicPlayerProvider } from '@/shared/lib/MusicPlayerContext';
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

function AppRoutes() {
  useAuthInit();

  return (
    <Routes>
      <Route path="/login" element={<GuestGuard><LoginPage /></GuestGuard>} />
      <Route path="/register" element={<GuestGuard><RegisterPage /></GuestGuard>} />
      <Route path="/profile/:id" element={<AuthGuard><MainLayout><ProfilePage /></MainLayout></AuthGuard>} />
      <Route path="/chats" element={<AuthGuard><ChatsPage /></AuthGuard>} />
      <Route path="/chats/:dialogId" element={<AuthGuard><ChatDialogPage /></AuthGuard>} />
      <Route path="/friends" element={<AuthGuard><MainLayout><FriendsPage /></MainLayout></AuthGuard>} />
      <Route path="/music" element={<AuthGuard><MainLayout><MusicPage /></MainLayout></AuthGuard>} />
      <Route path="/movies" element={<AuthGuard><MainLayout><MoviesPage /></MainLayout></AuthGuard>} />
      <Route path="/" element={<Navigate to="/chats" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <MusicPlayerProvider>
          <AppRoutes />
        </MusicPlayerProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
