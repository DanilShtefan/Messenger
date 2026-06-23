import { ProfileCard } from '@/widgets/ProfileCard/ProfileCard';
import { ProfilePosts } from '@/widgets/ProfilePosts/ProfilePosts';
import { useParams } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import styles from './ProfilePage.module.css';

export function ProfilePage() {
  const { id } = useParams();
  const currentUserId = useAppSelector((s) => s.user.currentUser?.id);
  const isOwn = currentUserId === id;

  return (
    <main className={styles.page}>
      <ProfileCard userId={id!} />
      <ProfilePosts userId={id!} isOwn={isOwn} />
    </main>
  );
}
