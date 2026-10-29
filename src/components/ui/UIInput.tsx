import React from 'react';
import { Search, LucideIcon, X } from 'lucide-react';

interface BaseInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
}

export interface UIInputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    BaseInputProps {
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
}

export const UIInput: React.FC<UIInputProps> = ({
  label,
  error,
  helperText,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {LeftIcon && (
          <LeftIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        )}
        <input
          id={inputId}
          className={`w-full bg-slate-50 border ${
            error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'
          } focus:bg-white rounded-lg ${LeftIcon ? 'pl-9' : 'px-3.5'} ${
            RightIcon ? 'pr-9' : 'pr-3.5'
          } py-2.5 text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all shadow-xs ${className}`}
          {...props}
        />
        {RightIcon && (
          <RightIcon className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        )}
      </div>
      {error && <p className="text-[11px] font-medium text-rose-600 mt-1">{error}</p>}
      {!error && helperText && <p className="text-[11px] text-slate-400 mt-1">{helperText}</p>}
    </div>
  );
};

export interface UISearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onClear?: () => void;
  containerClassName?: string;
}

export const UISearchInput: React.FC<UISearchInputProps> = ({
  value,
  onClear,
  containerClassName = 'w-full sm:w-64',
  placeholder = 'Search...',
  className = '',
  ...props
}) => {
  return (
    <div className={`relative ${containerClassName}`}>
      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        className={`w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg pl-9 pr-8 py-2 text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs ${className}`}
        {...props}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export interface UISelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
    BaseInputProps {}

export const UISelect: React.FC<UISelectProps> = ({
  label,
  error,
  helperText,
  children,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full bg-slate-50 border ${
          error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'
        } focus:bg-white rounded-lg px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 transition-all shadow-xs cursor-pointer ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-[11px] font-medium text-rose-600 mt-1">{error}</p>}
      {!error && helperText && <p className="text-[11px] text-slate-400 mt-1">{helperText}</p>}
    </div>
  );
};

export interface UITextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    BaseInputProps {}

export const UITextarea: React.FC<UITextareaProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  rows = 3,
  ...props
}) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-semibold text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        className={`w-full bg-slate-50 border ${
          error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'
        } focus:bg-white rounded-lg px-3.5 py-2.5 text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all shadow-xs resize-none ${className}`}
        {...props}
      />
      {error && <p className="text-[11px] font-medium text-rose-600 mt-1">{error}</p>}
      {!error && helperText && <p className="text-[11px] text-slate-400 mt-1">{helperText}</p>}
    </div>
  );
};

export const UIFilterBar: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between ${className}`}
    >
      {children}
    </div>
  );
};
