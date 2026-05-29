'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { MaterialWithThicknesses, DxfParseResult, PreventivoResult } from '@/types';
import { MaterialSelector } from '@/components/configuratore/MaterialSelector';
import { ThicknessSelector } from '@/components/configuratore/ThicknessSelector';
import { DxfUploader } from '@/components/configuratore/DxfUploader';
import { PreventivoPanel } from '@/components/configuratore/PreventivoPanel';
import { Input } from '@/components/ui/Input';

interface Props {
  materials: MaterialWithThicknesses[];
}

export function ConfiguratoreClient({ materials }: Props) {
  const router = useRouter();
  const [materialId, setMaterialId] = useState<number | null>(null);
  const [thicknessId, setThicknessId] = useState<number | null>(null);
  const [quantita, setQuantita] = useState(1);
  const [dxfResult, setDxfResult] = useState<DxfParseResult | null>(null);
  const [preventivoResult, setPreventivoResult] = useState<PreventivoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedMaterial = materials.find((m) => m.id === materialId) ?? null;
  const canCalcola = thicknessId !== null && dxfResult !== null;

  const calcola = useCallback(async () => {
    if (!thicknessId || !dxfResult) return;
    setLoading(true);
    try {
      const res = await fetch('/api/preventivo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thicknessId, metriLineari: dxfResult.metriLineari, quantita }),
      });
      const data = await res.json();
      if (res.ok) setPreventivoResult(data);
    } finally {
      setLoading(false);
    }
  }, [thicknessId, dxfResult, quantita]);

  useEffect(() => {
    if (!canCalcola) {
      setPreventivoResult(null);
      return;
    }
    calcola();
  }, [canCalcola, calcola]);

  function handleMaterialSelect(id: number) {
    setMaterialId(id);
    setThicknessId(null);
    setPreventivoResult(null);
    setDxfResult(null);
  }

  function handleOrdina() {
    if (!preventivoResult || !dxfResult || !materialId || !thicknessId) return;
    const params = new URLSearchParams({
      materialId: String(materialId),
      thicknessId: String(thicknessId),
      quantita: String(quantita),
      metriLineari: String(dxfResult.metriLineari),
      dxfKey: dxfResult.dxfKey,
      totale: String(preventivoResult.totale),
    });
    router.push(`/checkout?${params.toString()}`);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      {/* Colonna sinistra: form */}
      <div className="space-y-8">
        <MaterialSelector materials={materials} selectedId={materialId} onSelect={handleMaterialSelect} />

        {selectedMaterial && (
          <ThicknessSelector
            thicknesses={selectedMaterial.thicknesses}
            selectedId={thicknessId}
            onSelect={setThicknessId}
          />
        )}

        <Input
          label="Quantità pezzi"
          type="number"
          min={1}
          max={9999}
          value={quantita}
          onChange={(e) => setQuantita(Math.max(1, Number(e.target.value)))}
        />

        <DxfUploader
          onParsed={(r) => { setError(''); setDxfResult(r); }}
          onError={(msg) => { setError(msg); setDxfResult(null); }}
        />

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      {/* Colonna destra: preventivo */}
      <div className="sticky top-6">
        <PreventivoPanel
          result={preventivoResult}
          metriLineari={dxfResult?.metriLineari ?? null}
          loading={loading}
          onOrdina={handleOrdina}
          canOrdina={!!preventivoResult}
        />
      </div>
    </div>
  );
}
