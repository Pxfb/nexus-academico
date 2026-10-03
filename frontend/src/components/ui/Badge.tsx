import type { ReactNode } from 'react';

type BadgeProps = {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning';
};

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const variantClass =
    variant === 'success'
      ? 'badge-success'
      : variant === 'warning'
        ? 'badge-warning'
        : '';

  return <span className={`badge ${variantClass}`}>{children}</span>;
}
