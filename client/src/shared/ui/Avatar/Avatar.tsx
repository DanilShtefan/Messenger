import { memo } from 'react';
import { cn, getInitials } from '@/shared/lib/helpers';
import styles from './Avatar.module.css';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: AvatarSize;
  className?: string;
}

const sizeMap: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 80,
};

export const Avatar = memo(function Avatar({
  src,
  name,
  size = 'md',
  className,
}: AvatarProps) {
  const dimension = sizeMap[size];

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(styles.avatar, styles[size], className)}
        width={dimension}
        height={dimension}
      />
    );
  }

  return (
    <div
      className={cn(styles.avatar, styles.placeholder, styles[size], className)}
      style={{ width: dimension, height: dimension }}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
});
