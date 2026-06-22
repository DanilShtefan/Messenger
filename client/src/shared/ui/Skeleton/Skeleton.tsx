import { cn } from '@/shared/lib/helpers';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
}

export function Skeleton({
  width,
  height = '1rem',
  borderRadius = '0.375rem',
  className,
}: SkeletonProps) {
  return (
    <div
      className={cn(styles.skeleton, className)}
      style={{ width, height, borderRadius }}
      aria-hidden="true"
    />
  );
}
