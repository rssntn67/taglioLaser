import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calcolaPreventivo } from '@/lib/pricing/calculator';

export async function POST(request: NextRequest) {
  const body = await request.json() as { thicknessId: number; metriLineari: number; quantita: number };

  if (!body.thicknessId || body.metriLineari == null || !body.quantita) {
    return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 });
  }

  const price = await prisma.price.findUnique({ where: { thicknessId: body.thicknessId } });
  if (!price) {
    return NextResponse.json({ error: 'Prezzo non trovato per questo spessore' }, { status: 404 });
  }

  const result = calcolaPreventivo({
    quotaFissaEur: price.quotaFissaEur,
    costoPerMetroEur: price.costoPerMetroEur,
    metriLineari: body.metriLineari,
    quantita: body.quantita,
  });

  return NextResponse.json(result);
}
