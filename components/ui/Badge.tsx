const VARIANTS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-green-100 text-green-800',
};

const LABELS: Record<string, string> = {
  PENDING: 'In attesa',
  CONFIRMED: 'Confermato',
  PROCESSING: 'In lavorazione',
  SHIPPED: 'Spedito',
};

export function Badge({ status }: { status: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${VARIANTS[status] ?? 'bg-mist text-ink'}`}>
      {LABELS[status] ?? status}
    </span>
  );
}
