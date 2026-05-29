import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const materials = await prisma.material.findMany({
    include: {
      thicknesses: { include: { price: true }, orderBy: { valore: 'asc' } },
    },
    orderBy: { id: 'asc' },
  });

  return NextResponse.json(materials);
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const { thicknessId, quotaFissaEur, costoPerMetroEur } = await request.json();

  if (typeof quotaFissaEur !== 'number' || typeof costoPerMetroEur !== 'number') {
    return NextResponse.json({ error: 'Valori non validi' }, { status: 400 });
  }

  const price = await prisma.price.update({
    where: { thicknessId },
    data: { quotaFissaEur, costoPerMetroEur },
  });

  return NextResponse.json(price);
}
