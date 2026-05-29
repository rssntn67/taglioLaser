import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-ink uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full border border-border px-3 py-2.5 text-sm text-ink bg-white focus:outline-none focus:border-ink ${error ? 'border-red-500' : ''} ${className ?? ''}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
