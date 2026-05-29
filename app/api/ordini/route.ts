import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calcolaPreventivo } from '@/lib/pricing/calculator';
import { inviaEmailConferma } from '@/lib/email/sender';
import type { OrderPayload } from '@/types';

export async function POST(request: NextRequest) {
  const body = await request.json() as OrderPayload;

  const required = ['nome', 'email', 'materialId', 'thicknessId', 'quantita', 'metriLineari', 'dxfKey'];
  for (const field of required) {
    if (!body[field as keyof OrderPayload]) {
      return NextResponse.json({ error: `Campo obbligatorio mancante: ${field}` }, { status: 400 });
    }
  }

  if (!/^[0-9a-f-]{36}\.dxf$/.test(body.dxfKey)) {
    return NextResponse.json({ error: 'dxfKey non valido' }, { status: 400 });
  }

  const price = await prisma.price.findUnique({ where: { thicknessId: body.thicknessId } });
  if (!price) {
    return NextResponse.json({ error: 'Prezzo non trovato' }, { status: 404 });
  }

  const { totale } = calcolaPreventivo({
    quotaFissaEur: price.quotaFissaEur,
    costoPerMetroEur: price.costoPerMetroEur,
    metriLineari: body.metriLineari,
    quantita: body.quantita,
  });

  const order = await prisma.order.create({
    data: {
      nome: body.nome,
      email: body.email,
      azienda: body.azienda,
      pIva: body.pIva,
      note: body.note,
      materialId: body.materialId,
      thicknessId: body.thicknessId,
      quantita: body.quantita,
      metriLineari: body.metriLineari,
      prezzoTotale: totale,
      dxfKey: body.dxfKey,
    },
    include: { material: true, thickness: true },
  });

  try {
    await inviaEmailConferma({ nome: order.nome, email: order.email, orderId: order.id, prezzoTotale: order.prezzoTotale });
  } catch (err) {
    console.error('Email non inviata:', err);
  }

  return NextResponse.json({ orderId: order.id }, { status: 201 });
}
