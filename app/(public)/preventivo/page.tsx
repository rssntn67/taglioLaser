export const dynamic = 'force-dynamic';

import { ConfiguratoreClient } from './ConfiguratoreClient';
import prisma from '@/lib/prisma';
import type { MaterialWithThicknesses } from '@/types';

export default async function PreventivoPage() {
  const materials: MaterialWithThicknesses[] = await prisma.material.findMany({
    include: {
      thicknesses: {
        include: { price: true },
        orderBy: { valore: 'asc' },
      },
    },
    orderBy: { id: 'asc' },
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-black text-ink mb-2">Calcola il preventivo</h1>
      <p className="text-gray-400 mb-10">Carica il tuo file DXF e ottieni il prezzo in tempo reale.</p>
      <ConfiguratoreClient materials={materials} />
    </div>
  );
}
