import React from 'react';
import { LucideIcon } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'amber' | 'ghost' | 'dark' | 'outline-danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface UIButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs border border-emerald-600/30',
  secondary:
    'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs hover:border-slate-300',
  danger:
    'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs border border-rose-600/30',
  amber:
    'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-xs border border-amber-600/30',
  ghost:
    'text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50/50 border border-transparent',
  dark:
    'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white shadow-xs border border-slate-800',
  'outline-danger':
    'bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 shadow-xs hover:border-rose-300',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'text-xs px-3 py-1.5 rounded-lg font-semibold space-x-1',
  md: 'text-xs px-4 py-2.5 rounded-lg font-bold space-x-1.5',
  lg: 'text-sm px-5 py-3 rounded-xl font-bold space-x-2',
};

export const UIButton: React.FC<UIButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5"></span>
      ) : (
        Icon && iconPosition === 'left' && <Icon className="w-4 h-4 flex-shrink-0" />
      )}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className="w-4 h-4 flex-shrink-0" />
      )}
    </button>
  );
};
