import { ProfileCard } from '@/widgets/ProfileCard/ProfileCard';
import { useParams } from 'react-router-dom';
import styles from './ProfilePage.module.css';

export function ProfilePage() {
  const { id } = useParams();

  return (
    <main className={styles.page}>
      <ProfileCard userId={id!} />
    </main>
  );
}
