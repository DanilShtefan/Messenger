import { useEffect } from 'react';
import { connectSocket } from '@/shared/lib/socket';

interface UseSocketOptions {
  dialogId?: string;
  onTypingStart?: (data: { dialogId: string; userId: string }) => void;
  onTypingStop?: (data: { dialogId: string; userId: string }) => void;
  onDialogRead?: (data: { dialogId: string; userId: string }) => void;
}

export function useSocket({ dialogId, onTypingStart, onTypingStop, onDialogRead }: UseSocketOptions) {
  useEffect(() => {
    const socket = connectSocket();

    if (dialogId) {
      socket.emit('join:dialog', dialogId);
    }

    function handleTypingStart(data: { dialogId: string; userId: string }) {
      onTypingStart?.(data);
    }

    function handleTypingStop(data: { dialogId: string; userId: string }) {
      onTypingStop?.(data);
    }

    function handleDialogRead(data: { dialogId: string; userId: string }) {
      if (data.dialogId === dialogId) {
        onDialogRead?.(data);
      }
    }

    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('dialog:read', handleDialogRead);

    return () => {
      if (dialogId) {
        socket.emit('leave:dialog', dialogId);
      }
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('dialog:read', handleDialogRead);
    };
  }, [dialogId, onTypingStart, onTypingStop, onDialogRead]);
}