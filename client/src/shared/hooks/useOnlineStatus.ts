import { useEffect, useState } from 'react';
import { connectSocket } from '@/shared/lib/socket';
import { jwtDecode } from 'jwt-decode';

let onlineUsers = new Set<string>();
let initialized = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

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

function init() {
  if (initialized) return;
  initialized = true;

  const socket = connectSocket();
  const currentUserId = getCurrentUserId();

  if (currentUserId && socket.connected) {
    onlineUsers = new Set(onlineUsers).add(currentUserId);
    notify();
  }

  function handleConnect() {
    if (currentUserId) {
      onlineUsers = new Set(onlineUsers).add(currentUserId);
      notify();
    }
  }

  function handleOnlineList(ids: string[]) {
    onlineUsers = new Set(ids);
    notify();
  }

  function handleOnline(userId: string) {
    onlineUsers = new Set(onlineUsers).add(userId);
    notify();
  }

  function handleOffline(userId: string) {
    const next = new Set(onlineUsers);
    next.delete(userId);
    onlineUsers = next;
    notify();
  }

  socket.on('connect', handleConnect);
  socket.on('online:list', handleOnlineList);
  socket.on('user:online', handleOnline);
  socket.on('user:offline', handleOffline);
}

export function useOnlineStatus() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    init();
    const fn = () => forceUpdate((n) => n + 1);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  const isOnline = (userId: string) => onlineUsers.has(userId);

  return { onlineUsers, isOnline };
}
