import { Sidebar } from '@/widgets/Sidebar/Sidebar';
import { ErrorBoundary } from '@/app/providers/ErrorBoundary';
import styles from './MainLayout.module.css';
import type { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className={styles.layout}>
      <ErrorBoundary>
        <Sidebar />
      </ErrorBoundary>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </div>
  );
}
