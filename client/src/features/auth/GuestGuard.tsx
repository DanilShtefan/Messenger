import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';

interface GuestGuardProps {
  children: React.ReactNode;
}

export function GuestGuard({ children }: GuestGuardProps) {
  const isAuthenticated = useAppSelector((s) => s.user.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/chats" replace />;
  }

  return <>{children}</>;
}
