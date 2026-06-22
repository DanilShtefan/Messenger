import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Sidebar } from '@/widgets/Sidebar/Sidebar';
import { ChatWindow } from '@/widgets/ChatWindow/ChatWindow';
import { useFetchChats } from '@/shared/hooks/useFetchChats';
import { useAppSelector } from '@/app/hooks';
import styles from './ChatDialogPage.module.css';

export function ChatDialogPage() {
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
        <Sidebar />
      </div>
    );
  }

  const participant = dialog.participant;
  const isMe = participant.id === currentUserId;
  const participantName = isMe ? 'Saved Messages' : participant.displayName;
  const participantAvatar = participant.avatarUrl ?? null;

  return (
    <div className={styles.layout}>
      <Sidebar />
      <ChatWindow
        dialogId={dialogId}
        participantName={participantName}
        participantAvatar={participantAvatar}
      />
    </div>
  );
}
