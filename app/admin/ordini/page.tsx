export const dynamic = 'force-dynamic';

import prisma from '@/lib/prisma';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

export default async function AdminOrdiniPage() {
  const orders = await prisma.order.findMany({
    include: { material: true },
    orderBy: { createdAt: 'desc' },
  });

  const csv = [
    'ID,Data,Nome,Email,Azienda,Materiale,SpessoreID,Quantità,ML,Totale,Stato',
    ...orders.map((o) =>
      [o.id, o.createdAt.toISOString(), o.nome, o.email, o.azienda ?? '', o.material.nome, o.thicknessId, o.quantita, o.metriLineari, o.prezzoTotale, o.status].join(',')
    ),
  ].join('\n');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-ink">Ordini</h1>
        <a
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
          download="ordini.csv"
          className="text-xs border border-border px-4 py-2 hover:border-ink"
        >
          Export CSV
        </a>
      </div>

      <div className="bg-white border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-mist">
            <tr className="text-xs text-gray-400 uppercase">
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Data</th>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Materiale</th>
              <th className="px-4 py-3 text-right">Totale</th>
              <th className="px-4 py-3 text-left">Stato</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-border last:border-0 hover:bg-mist">
                <td className="px-4 py-3 font-mono text-xs">
                  <Link href={`/admin/ordini/${o.id}`} className="hover:underline">{o.id}</Link>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {o.createdAt.toLocaleDateString('it-IT')}
                </td>
                <td className="px-4 py-3">{o.nome}</td>
                <td className="px-4 py-3 text-gray-500">{o.material.nome}</td>
                <td className="px-4 py-3 text-right font-semibold">€ {o.prezzoTotale.toFixed(2)}</td>
                <td className="px-4 py-3"><Badge status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
