import { useEffect, useRef, useState } from 'react';
import { connectSocket } from '@/shared/lib/socket';
import { jwtDecode } from 'jwt-decode';

function getCurrentUserId(): string | null {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    const payload = jwtDecode<{ userId: string }>(token);
    return payload.userId;
  } catch {
    return null;
  }
}

export function useOnlineStatus() {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const ref = useRef(onlineUsers);
  ref.current = onlineUsers;

  useEffect(() => {
    const socket = connectSocket();
    const currentUserId = getCurrentUserId();

    if (currentUserId && socket.connected) {
      setOnlineUsers((prev) => new Set(prev).add(currentUserId));
    }

    function handleConnect() {
      if (currentUserId) {
        setOnlineUsers((prev) => new Set(prev).add(currentUserId));
      }
    }

    function handleOnline(userId: string) {
      setOnlineUsers((prev) => new Set(prev).add(userId));
    }

    function handleOffline(userId: string) {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }

    socket.on('connect', handleConnect);
    socket.on('user:online', handleOnline);
    socket.on('user:offline', handleOffline);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('user:online', handleOnline);
      socket.off('user:offline', handleOffline);
    };
  }, []);

  const isOnline = (userId: string) => ref.current.has(userId);

  return { onlineUsers, isOnline };
}
