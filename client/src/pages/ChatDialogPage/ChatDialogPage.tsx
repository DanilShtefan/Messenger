import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sidebar } from '@/widgets/Sidebar/Sidebar';
import { ChatWindow } from '@/widgets/ChatWindow/ChatWindow';
import { ErrorBoundary } from '@/app/providers/ErrorBoundary';
import { BackgroundLayer } from '@/shared/ui/BackgroundLayer/BackgroundLayer';
import { useFetchChats } from '@/shared/hooks/useFetchChats';
import { useAppSelector } from '@/app/hooks';
import styles from './ChatDialogPage.module.css';

export function ChatDialogPage() {
  const { t } = useTranslation('common');
  const { dialogId } = useParams();
  const { chats } = useFetchChats();
  const currentUserId = useAppSelector((s) => s.user.currentUser?.id);

  const dialog = useMemo(
    () => chats.find((c) => c.id === dialogId),
    [chats, dialogId],
  );

  if (!dialogId || !dialog) {
    return (
      <div className={styles.layout}>
        <ErrorBoundary>
          <Sidebar />
        </ErrorBoundary>
        <div className={styles.content}>
          <BackgroundLayer />
        </div>
      </div>
    );
  }

  const participant = dialog.participant;
  const isMe = participant.id === currentUserId;
  const participantName = isMe ? t('saved_messages') : participant.displayName;
  const participantAvatar = participant.avatarUrl ?? null;

  return (
    <div className={styles.layout}>
      <ErrorBoundary>
        <Sidebar />
      </ErrorBoundary>
      <div className={styles.content}>
        <BackgroundLayer />
        <ErrorBoundary>
          <ChatWindow
            dialogId={dialogId}
            participantName={participantName}
            participantAvatar={participantAvatar}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}
