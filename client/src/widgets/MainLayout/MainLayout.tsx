import { Sidebar } from '@/widgets/Sidebar/Sidebar';
import styles from './MainLayout.module.css';
import type { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className={styles.layout}>
      <Sidebar />
      {children}
    </div>
  );
}
