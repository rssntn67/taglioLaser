import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export function Button({ variant = 'primary', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'px-5 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50',
        variant === 'primary' && 'bg-ink text-white hover:opacity-80',
        variant === 'secondary' && 'border border-border text-ink hover:border-ink',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
