import { Sidebar } from '@/widgets/Sidebar/Sidebar';
import { ErrorBoundary } from '@/app/providers/ErrorBoundary';
import { BackgroundLayer } from '@/shared/ui/BackgroundLayer/BackgroundLayer';
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
      <div className={styles.content}>
        <BackgroundLayer />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </div>
    </div>
  );
}
