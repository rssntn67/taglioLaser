import type { PreventivoResult } from '@/types';
import { Button } from '@/components/ui/Button';

interface Props {
  result: PreventivoResult | null;
  metriLineari: number | null;
  loading: boolean;
  onOrdina: () => void;
  canOrdina: boolean;
}

export function PreventivoPanel({ result, metriLineari, loading, onOrdina, canOrdina }: Props) {
  return (
    <div className="bg-mist border border-border p-8 h-full flex flex-col">
      <h2 className="text-lg font-black text-ink mb-6">Preventivo</h2>

      {!result && !loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400 text-center">
            Seleziona materiale, spessore<br />e carica il file DXF.
          </p>
        </div>
      )}

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400">Calcolo in corso...</p>
        </div>
      )}

      {result && !loading && (
        <div className="flex-1 space-y-4">
          {metriLineari != null && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Metri lineari taglio</p>
              <p className="text-2xl font-black text-ink">{metriLineari.toFixed(3)} ml</p>
            </div>
          )}
          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Quota fissa</span>
              <span className="font-semibold">€ {result.quotaFissaTotale.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Costo taglio</span>
              <span className="font-semibold">€ {result.costoTaglioTotale.toFixed(2)}</span>
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-ink">Totale</span>
              <span className="text-3xl font-black text-ink">€ {result.totale.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">IVA esclusa</p>
          </div>
          <Button onClick={onOrdina} disabled={!canOrdina} className="w-full mt-4">
            Ordina ora →
          </Button>
        </div>
      )}
    </div>
  );
}
