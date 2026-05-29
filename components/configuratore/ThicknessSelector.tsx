import type { ThicknessWithPrice } from '@/types';

interface Props {
  thicknesses: ThicknessWithPrice[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function ThicknessSelector({ thicknesses, selectedId, onSelect }: Props) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Spessore (mm)</p>
      <div className="flex flex-wrap gap-2">
        {thicknesses.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`border px-3 py-1.5 text-sm font-mono transition-colors ${
              selectedId === t.id ? 'border-ink bg-ink text-white' : 'border-border text-ink hover:border-ink'
            }`}
          >
            {t.valore}
          </button>
        ))}
      </div>
    </div>
  );
}
