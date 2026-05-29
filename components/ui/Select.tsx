import { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string | number; label: string }[];
}

export function Select({ label, options, id, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-ink uppercase tracking-wide">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`w-full border border-border px-3 py-2.5 text-sm text-ink bg-white focus:outline-none focus:border-ink ${className ?? ''}`}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
