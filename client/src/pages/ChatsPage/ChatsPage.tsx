import { Sidebar } from '@/widgets/Sidebar/Sidebar';
import { MessagesTab } from '@/widgets/Sidebar/MessagesTab';
import styles from './ChatsPage.module.css';

export function ChatsPage() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.chatList}>
        <MessagesTab />
      </div>
    </div>
  );
}
