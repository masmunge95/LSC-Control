import React from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'power'
  | 'tab';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon-sm' | 'icon-md';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  iconClassName?: string;
  isLoading?: boolean;
  isActive?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  iconClassName = '',
  isLoading = false,
  isActive = false,
  disabled = false,
  className = '',
  ...props
}) => {
  // Base classes for all buttons
  const baseClasses =
    'inline-flex items-center justify-center font-bold tracking-tight rounded-xl transition-all duration-200 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.97]';

  // Sizing definitions
  const sizeClasses: Record<ButtonSize, string> = {
    xs: 'px-2.5 py-1 text-[11px] gap-1.5 rounded-lg',
    sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-xl',
    md: 'px-4 py-2.5 text-xs gap-2 rounded-xl',
    lg: 'px-5 py-3 text-sm gap-2.5 rounded-2xl',
    'icon-sm': 'p-2 rounded-xl',
    'icon-md': 'p-2.5 rounded-xl',
  };

  // Variant styling rules
  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-zinc-950 shadow-lg shadow-cyan-950/60 border border-cyan-400/40 hover:shadow-cyan-900/80',
    secondary:
      'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 hover:border-zinc-600 shadow-sm',
    ghost:
      'bg-transparent hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-100 border border-transparent',
    danger:
      'bg-zinc-900 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-300 border border-zinc-800 hover:border-rose-800/80 shadow-sm',
    success:
      'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.25)]',
    power: isActive
      ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 hover:bg-emerald-500/35 shadow-[0_0_20px_rgba(16,185,129,0.35)]'
      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700',
    tab: isActive
      ? 'bg-zinc-800 text-cyan-400 border border-zinc-700 shadow-sm'
      : 'bg-zinc-950/80 text-zinc-400 hover:text-zinc-200 border border-zinc-850 hover:border-zinc-700',
  };

  // Icon sizing
  const iconSizeClasses: Record<ButtonSize, string> = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    'icon-sm': 'w-4 h-4',
    'icon-md': 'w-4 h-4',
  };

  const defaultIconClass = `${iconSizeClasses[size]} shrink-0 ${iconClassName}`;

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className={`${defaultIconClass} animate-spin`} />
      ) : (
        Icon && <Icon className={defaultIconClass} />
      )}
      {children}
      {!isLoading && IconRight && <IconRight className={defaultIconClass} />}
    </button>
  );
};

