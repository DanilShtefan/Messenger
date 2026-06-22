import { cn } from '@/shared/lib/helpers';
import styles from './ErrorFallback.module.css';

interface ErrorFallbackProps {
  error?: Error | null;
  resetError?: () => void;
  className?: string;
}

export function ErrorFallback({ error, resetError, className }: ErrorFallbackProps) {
  return (
    <div className={cn(styles.wrapper, className)} role="alert">
      <div className={styles.icon}>!</div>
      <h2 className={styles.title}>Something went wrong</h2>
      {error && <p className={styles.message}>{error.message}</p>}
      {resetError && (
        <button className={styles.retry} onClick={resetError} type="button">
          Try again
        </button>
      )}
    </div>
  );
}
