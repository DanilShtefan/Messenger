import { Sidebar } from '@/widgets/Sidebar/Sidebar';
import { MessagesTab } from '@/widgets/Sidebar/MessagesTab';
import { ErrorBoundary } from '@/app/providers/ErrorBoundary';
import styles from './ChatsPage.module.css';

export function ChatsPage() {
  return (
    <div className={styles.layout}>
      <ErrorBoundary>
        <Sidebar />
      </ErrorBoundary>
      <ErrorBoundary>
        <div className={styles.chatList}>
          <MessagesTab />
        </div>
      </ErrorBoundary>
    </div>
  );
}
