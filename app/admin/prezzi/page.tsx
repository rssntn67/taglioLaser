'use client';

import { useEffect, useState } from 'react';
import type { MaterialWithThicknesses } from '@/types';

interface EditState {
  thicknessId: number;
  quotaFissaEur: string;
  costoPerMetroEur: string;
}

export default function AdminPrezziPage() {
  const [materials, setMaterials] = useState<MaterialWithThicknesses[]>([]);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/admin/prezzi').then((r) => r.json()).then(setMaterials);
  }, []);

  function startEdit(t: MaterialWithThicknesses['thicknesses'][number]) {
    setEditing({
      thicknessId: t.id,
      quotaFissaEur: String(t.price?.quotaFissaEur ?? ''),
      costoPerMetroEur: String(t.price?.costoPerMetroEur ?? ''),
    });
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    await fetch('/api/admin/prezzi', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        thicknessId: editing.thicknessId,
        quotaFissaEur: parseFloat(editing.quotaFissaEur),
        costoPerMetroEur: parseFloat(editing.costoPerMetroEur),
      }),
    });
    setSaved(editing.thicknessId);
    setEditing(null);
    setSaving(false);
    const updated = await fetch('/api/admin/prezzi').then((r) => r.json());
    setMaterials(updated);
    setTimeout(() => setSaved(null), 2000);
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-ink mb-8">Gestione Prezzi</h1>
      <p className="text-sm text-gray-400 mb-6">
        Clicca su un prezzo per modificarlo. Quota fissa = costo per pezzo; Costo/ml = costo al metro lineare di taglio.
      </p>

      {materials.map((m) => (
        <div key={m.id} className="mb-8">
          <h2 className="text-sm font-black text-ink uppercase tracking-wide mb-3">{m.nome}</h2>
          <div className="bg-white border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-mist">
                <tr className="text-xs text-gray-400 uppercase">
                  <th className="px-4 py-2 text-left">Spessore (mm)</th>
                  <th className="px-4 py-2 text-right">Quota fissa (€/pz)</th>
                  <th className="px-4 py-2 text-right">Costo/ml (€/m)</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {m.thicknesses.map((t) => {
                  const isEditing = editing?.thicknessId === t.id;
                  return (
                    <tr key={t.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-mono">{t.valore}</td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editing.quotaFissaEur}
                            onChange={(e) => setEditing({ ...editing, quotaFissaEur: e.target.value })}
                            className="border border-border px-2 py-1 w-20 text-right text-xs"
                          />
                        ) : (
                          <span className={saved === t.id ? 'text-green-600' : ''}>
                            € {t.price?.quotaFissaEur.toFixed(2) ?? '—'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editing.costoPerMetroEur}
                            onChange={(e) => setEditing({ ...editing, costoPerMetroEur: e.target.value })}
                            className="border border-border px-2 py-1 w-20 text-right text-xs"
                          />
                        ) : (
                          <span className={saved === t.id ? 'text-green-600' : ''}>
                            € {t.price?.costoPerMetroEur.toFixed(2) ?? '—'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <div className="flex gap-2 justify-end">
                            <button onClick={saveEdit} disabled={saving} className="text-xs bg-ink text-white px-3 py-1">
                              {saving ? '...' : 'Salva'}
                            </button>
                            <button onClick={() => setEditing(null)} className="text-xs border border-border px-3 py-1">
                              Annulla
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => startEdit(t)} className="text-xs text-gray-400 hover:text-ink">
                            Modifica
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
