'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'In attesa' },
  { value: 'CONFIRMED', label: 'Confermato' },
  { value: 'PROCESSING', label: 'In lavorazione' },
  { value: 'SHIPPED', label: 'Spedito' },
];

interface OrderDetail {
  id: number;
  createdAt: string;
  status: string;
  nome: string;
  email: string;
  azienda?: string;
  pIva?: string;
  note?: string;
  quantita: number;
  metriLineari: number;
  prezzoTotale: number;
  dxfKey: string;
  material: { nome: string };
  thickness: { valore: number; price: { quotaFissaEur: number; costoPerMetroEur: number } | null };
}

export default function OrdineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/ordini/${id}`)
      .then((r) => r.json())
      .then((o) => { setOrder(o); setStatus(o.status); });
  }, [id]);

  async function handleStatusChange() {
    setSaving(true);
    await fetch(`/api/admin/ordini/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setSaving(false);
    if (order) setOrder({ ...order, status });
  }

  if (!order) return <div className="text-sm text-gray-400">Caricamento...</div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-2xl font-black text-ink">Ordine #{order.id}</h1>
        <Badge status={order.status} />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-border p-6 space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wide text-ink mb-4">Cliente</h2>
          <p className="text-sm"><span className="text-gray-400">Nome:</span> {order.nome}</p>
          <p className="text-sm"><span className="text-gray-400">Email:</span> {order.email}</p>
          {order.azienda && <p className="text-sm"><span className="text-gray-400">Azienda:</span> {order.azienda}</p>}
          {order.pIva && <p className="text-sm"><span className="text-gray-400">P.IVA:</span> {order.pIva}</p>}
          {order.note && <p className="text-sm"><span className="text-gray-400">Note:</span> {order.note}</p>}
        </div>

        <div className="bg-white border border-border p-6 space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wide text-ink mb-4">Lavorazione</h2>
          <p className="text-sm"><span className="text-gray-400">Materiale:</span> {order.material.nome}</p>
          <p className="text-sm"><span className="text-gray-400">Spessore:</span> {order.thickness.valore} mm</p>
          <p className="text-sm"><span className="text-gray-400">Quantità:</span> {order.quantita} pz</p>
          <p className="text-sm"><span className="text-gray-400">Metri lineari:</span> {order.metriLineari.toFixed(3)} ml</p>
          <p className="text-sm font-semibold">Totale: € {order.prezzoTotale.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white border border-border p-6 mb-6">
        <h2 className="text-xs font-black uppercase tracking-wide text-ink mb-4">File DXF</h2>
        <a
          href={`/api/admin/ordini/${order.id}/dxf`}
          className="text-sm underline hover:opacity-70"
        >
          Scarica file DXF →
        </a>
      </div>

      <div className="bg-white border border-border p-6">
        <h2 className="text-xs font-black uppercase tracking-wide text-ink mb-4">Aggiorna stato</h2>
        <div className="flex items-center gap-4">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-border px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <Button onClick={handleStatusChange} disabled={saving || status === order.status}>
            {saving ? 'Salvataggio...' : 'Aggiorna'}
          </Button>
        </div>
      </div>
    </div>
  );
}
