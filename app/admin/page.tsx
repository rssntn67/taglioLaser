export const dynamic = 'force-dynamic';

import prisma from '@/lib/prisma';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

export default async function AdminDashboard() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [oggi, settimana, mese, ultimi] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.order.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { material: true },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-black text-ink mb-8">Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-10">
        {[{ label: 'Oggi', val: oggi }, { label: 'Settimana', val: settimana }, { label: 'Mese', val: mese }].map((s) => (
          <div key={s.label} className="bg-white border border-border p-6">
            <p className="text-3xl font-black text-ink">{s.val}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-black text-ink uppercase tracking-wide mb-4">Ultimi ordini</h2>
      <div className="bg-white border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border">
            <tr className="text-xs text-gray-400 uppercase">
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Materiale</th>
              <th className="px-4 py-3 text-right">Totale</th>
              <th className="px-4 py-3 text-left">Stato</th>
            </tr>
          </thead>
          <tbody>
            {ultimi.map((o) => (
              <tr key={o.id} className="border-b border-border hover:bg-mist">
                <td className="px-4 py-3 font-mono text-xs">
                  <Link href={`/admin/ordini/${o.id}`} className="hover:underline">{o.id}</Link>
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
