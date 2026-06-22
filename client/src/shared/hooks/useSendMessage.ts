import { useCallback, useState } from 'react';
import { messagesApi } from '@/shared/api/messages.api';
import type { Message, SendMessageRequest } from '@/shared/types';

interface UseSendMessageReturn {
  send: (data: SendMessageRequest) => Promise<Message>;
  isLoading: boolean;
  error: string | null;
}

export function useSendMessage(): UseSendMessageReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async (data: SendMessageRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      return await messagesApi.send(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { send, isLoading, error };
}
