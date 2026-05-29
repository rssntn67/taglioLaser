import type { MaterialWithThicknesses } from '@/types';

interface Props {
  materials: MaterialWithThicknesses[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function MaterialSelector({ materials, selectedId, onSelect }: Props) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Materiale</p>
      <div className="grid grid-cols-2 gap-2">
        {materials.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className={`border p-3 text-left text-sm font-semibold transition-colors ${
              selectedId === m.id ? 'border-ink bg-ink text-white' : 'border-border text-ink hover:border-ink'
            }`}
          >
            {m.nome}
          </button>
        ))}
      </div>
    </div>
  );
}
